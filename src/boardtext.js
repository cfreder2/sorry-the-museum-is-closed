// What is written on the whiteboards.
//
// Staff notes, left overnight. Each entry says which room it is in (a pattern tried against the
// room's name; `skip` passes over that many matching rooms first, so two boards with the same
// pattern land in different rooms) and what it says, a line to a string. The first character of a
// line says how it is written:
//
//   #  a heading, big, in blue          -  a bullet            >  an aside, indented, in green
//   !  in red, underlined               =  a line blacked out  [  a tick box, empty; [x ticked
//   (anything else: plain black)
//
// `doodle` adds a small drawing in the corner. Nobody real is named anywhere on them.
//
// No DOM and no three.js here: src/furnish.js reads this to hang a board in each of these rooms,
// and src/whiteboards.js to write on them. The Director's board (`clue`) is written by
// src/secret.js, since what it says depends on tonight's hang.

export const BOARDS = [
  { id: 'clue', room: /^Director's office/i, largest: true, title: 'The Director\'s whiteboard', lines: ['#MEMO'] },
  { id: 'decoy', room: /^Director's office/i, skip: 1, title: 'A whiteboard in the other Director\'s office', doodle: 'car', lines: [
    '#THIS WEEK', '- board dinner moved to Thursday', '- sign off the spring hang', '- tyre marks on my rug. SMALL ones. Who?', '- heating bill lists a "sub-level 9".', '>ask Facilities what that is', '!Facilities say there is no sub-level 9.'] },
  { id: 'security', room: /^Security control/i, title: 'The security control room\'s whiteboard', doodle: 'button', lines: [
    '#NIGHT SHIFT', '- walk every floor at 1, 3 and 5', '- camera 14 shows a toy car again. Reboot it.', '- the big red button is NOT a drill button', '>it is the HEIST button. It starts a heist.', '!DO NOT PRESS (again)'] },
  { id: 'incidents', room: /^Security control/i, skip: 1, title: 'A whiteboard of incidents', doodle: 'cards', lines: [
    '#INCIDENTS', '- 02:10 motion upstairs. Nothing there.', '- 03:40 lift called to 3. By nobody.', '- roof: fairy lights ON, sound of cards', '>sent the new one up. He lost $40.', '!somebody keeps leaving plywood on the stairs'] },
  { id: 'lost', room: /^Staff canteen/i, title: 'The canteen\'s whiteboard', doodle: 'tally', lines: [
    '#LOST PROPERTY', '- umbrellas', '- single gloves', '- balloons (on the ceiling)', '- toy cars: 0, but we keep HEARING one', '>fridge is emptied on FRIDAYS. Label it.'] },
  { id: 'registrar', room: /^Registrar$/i, title: 'The Registrar\'s whiteboard', doodle: 'arrow', lines: [
    '#IN / OUT', '- crate 14 back Tuesday', '- courier at the dock 07:30 sharp', '- condition reports BEFORE it is unpacked', '- every work on the wall has a number', '>count them. Somebody is. All night.'] },
  { id: 'it', room: /^Information technology/i, title: 'The IT office\'s whiteboard', doodle: 'screen', lines: [
    '#TICKETS', '- "old monitor in the lab will not turn off"', '- same ticket, ten rooms, all four levels', '- they all have GAMES on them. Who?', '- do not unplug: people have high scores', '!the wifi password is NOT on this board'] },
  { id: 'studio', room: /^Paintings conservation studio/i, title: 'A conservation studio\'s whiteboard', doodle: 'brush', lines: [
    '#BEFORE YOU TOUCH IT', '[x photograph it', '[x look under UV', '[ solvent test: small, in a corner', '[ write it down', '[ write it down AGAIN', '!no coffee past the yellow line'] },
  { id: 'science', room: /^Conservation science laboratory/i, title: 'The laboratory\'s whiteboard', doodle: 'flask', lines: [
    '#SAMPLE QUEUE', '- 7: lead white. Fine.', '- 8: natural ultramarine. Lovely.', '- 9: "not on the periodic table" ?? re-run', '>re-ran it. Same answer.', '!Facilities took sample 9. Said forget it.'] },
  { id: 'xray', room: /^X-ray room/i, title: 'The X-ray room\'s whiteboard', lines: [
    '#X-RAY LOG', '- Tue: panel, two exposures', '- Wed: frame backing, north wall', '>CANCELLED by Facilities', '- Thu: same wall', '>CANCELLED by Facilities. Again.', '!why do Facilities care about a WALL'] },
  { id: 'paper', room: /^Paper conservation studio/i, title: 'The paper studio\'s whiteboard', lines: [
    '#THIS WEEK', '- three prints to float-wash', '- hinges: wheat starch, NOT the tape', '- blotters are drying. Hands off.', '- humidity 50. Keep the door SHUT.', '>draughts come up from somewhere below'] },
  { id: 'curators', room: /^Curators, European painting/i, title: 'The curators\' whiteboard', doodle: 'frame', lines: [
    '#SPRING HANG', '- swap the two landscapes', '- label typo: "oil on canavs" !!', '- visitor asked what the lamps are for', '>they come on when you get near. Try it.', '- who painted ARROWS on the 2nd floor'] },
  { id: 'curators2', room: /^Curators, American art/i, title: 'A whiteboard of things to do', doodle: 'puck', lines: [
    '#TO DO', '- loan letters', '- wall text: 80 words. EIGHTY.', '- the pond north of the building:', '>who put hockey goals on it? And a puck?', '- the blue car out there is not ours either'] },
  { id: 'handlers', room: /^Art handlers/i, title: 'The art handlers\' whiteboard', doodle: 'ramp', lines: [
    '#HANDLERS', '- gloves ON', '- two people for anything bigger than you', '- van keys live on THIS hook', '- WHO is leaving ramps in the galleries', '>not funny.   (a bit funny.)'] },
  { id: 'painting', room: /^School painting studio/i, title: 'A studio whiteboard', doodle: 'sun', lines: [
    '#TODAY: COLOUR', '- three primaries, then stop', '- mix a green you have never seen', '- paint the light, not the thing', '!wash your brushes or else'] },
  { id: 'drawing', room: /^School drawing studio/i, title: 'A studio whiteboard', doodle: 'star', lines: [
    '#LIFE DRAWING 6 PM', '- bring charcoal', '- two-minute poses, then twenty', '- draw what you SEE, not what you know', '>the model is a plaster cast. Be kind.'] },
  { id: 'exhibitions', room: /^Exhibitions office/i, title: 'The exhibitions office\'s whiteboard', doodle: 'hoop', lines: [
    '#OPENING IN 9 DAYS', '- lighting', '- labels', '- cases: glass on LAST', '- somebody please count the hoops', '>why are there hoops'] },
  { id: 'engineers', room: /^Building engineers/i, title: 'The engineers\' whiteboard', doodle: 'pipe', lines: [
    '#PLANT', '- boiler 2: service due', '- AHU 4: filter', '- scaffold, south side: STILL UP', '>somebody plays cards up there at night', '!"sub-level 9" is not on OUR drawings'] },
  { id: 'mail', room: /^Mail room/i, title: 'The mail room\'s whiteboard', doodle: 'parcel', lines: [
    '#POST', '- out by 4', '- parcels for "Facilities" (no name):', '>leave them by the lift. They go overnight.', '- do NOT open them', '!one of them hummed'] },
  { id: 'hr', room: /^Human resources/i, title: 'A whiteboard of reminders', lines: [
    '#REMINDERS', '- timesheets Friday', '- fire drill Tuesday (a real drill)', '- night staff: the building is EMPTY', '>if you see a toy car you are tired', '>go home'] },
  { id: 'housekeeping', room: /^Housekeeping/i, title: 'Housekeeping\'s whiteboard', doodle: 'snowman', lines: [
    '#FLOORS', '- mop the 2nd floor ring before 6', '- WET FLOOR signs keep getting knocked flat', '>tyre marks. Again.', '- snowmen on the lawn: not ours', '!leave the snowmen ALONE'] },
  { id: 'volunteers', room: /^Volunteers/i, title: 'The volunteers\' whiteboard', doodle: 'lion', lines: [
    '#AT THE DESK', '- smile', '- the lions are called "the lions"', '- the front doors are LOCKED at night', '>(the air vent beside them is not)', '- if asked: there is NOTHING under the building'] },
  { id: 'dye', room: /^Dye laboratory/i, title: 'The dye laboratory\'s whiteboard', doodle: 'flask', lines: [
    '#DYE LOT 31', '- madder: 40 min, not 45', '- indigo vat is ALIVE. Feed it.', '- green sample from Facilities: do not match it', '>it glows. Dyes should not glow.'] },
  // ---- what is on no drawing ----
  { id: 'days', room: /^Sub-level 9/i, secret: true, title: 'A whiteboard, twelve metres down', doodle: 'zero', lines: [
    '#DAYS SINCE LAST INCIDENT', '', '', '- item 12 got out again. It likes the lift.', '=', '- whoever taught item 12 poker: STOP'] },
  { id: 'object', room: /^Sub-level 9/i, skip: 0, second: true, secret: true, title: 'A whiteboard with a diagram on it', doodle: 'ufo', lines: [
    '#OBJECT 9', '- recovered ==========', '- hull: unknown alloy', '- no engine. No fuel. No door.', '- it follows whoever goes near it', '!DO NOT SIT IN IT'] },
  { id: 'stars', room: /^Debriefing room/i, secret: true, title: 'A star chart', doodle: 'chart', lines: [
    '#WHERE FROM', '- 39 light years, give or take', '=', '- they ask to see "the picture" upstairs', '>which picture? Why THAT bit of it?', '=', '!cover story: "the heating plant"'] },
  { id: 'jars', room: /^Specimen room/i, secret: true, title: 'A whiteboard by the jars', doodle: 'alien', lines: [
    '#SPECIMENS', '- do not tap the glass', '- top up the green on Mondays', '- jar 4 waved. Log it.', '- jar 4 waved AGAIN', '!nobody is to wave back'] },
];
export const BOARD = Object.fromEntries(BOARDS.map(b => [b.id, b]));

// Which room gets which board: { roomId: [ids] }. `rooms` is the plan's list; `ok(room)` says whether
// the room is one that gets furnished at all. A room takes one board, except where an entry is
// marked `second` (the store has two).
export function assignBoards(rooms, ok = () => true) {
  const out = {}, cand = rooms.filter(r => r.kind === 'room' && ok(r)), area = r => (r.x1 - r.x0) * (r.z1 - r.z0);
  for (const b of BOARDS) {
    let list = cand.filter(r => b.room.test(String(r.gallery || '').replace(/ \d+$/, '')));
    if (b.largest || /Director/.test(b.room.source)) list = list.slice().sort((p, q) => area(q) - area(p) || (p.id < q.id ? -1 : 1));
    const free = list.filter(r => b.second || !out[r.id]);
    const r = free[Math.min(b.skip || 0, Math.max(0, free.length - 1))];
    if (!r || (!b.second && out[r.id])) continue;
    (out[r.id] = out[r.id] || []).push(b.id);
  }
  return out;
}

// The words of a board as plain text, for the card and for anyone who cannot see it.
export const plainText = lines => lines.filter(Boolean).map(l => (/^[#\->!]/.test(l) ? l.slice(1) : l[0] === '=' ? '(a line blacked out)' : l[0] === '[' ? (l[1] === 'x' ? 'Done: ' + l.slice(2) : 'Not done: ' + l.slice(1)) : l).replace(/=+/g, '(blacked out)').trim()).join('\n');
