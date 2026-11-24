// The command prompt on the security desk's computer.
//
// A small shell over the made-up filesystem in src/secfiles.js. Both families of commands work and it is
// forgiving about which you use: ls or dir, cat or type, clear or cls, backslashes, a drive letter, capitals,
// a file's name without its ending. It is also the building's control panel: every system that
// G.systems lists (src/systems.js: sprinklers, firetest, lights, lift, doors, pa) is a command by its id.
//
// No DOM here: src/secdesk.js draws it. `run(line)` returns the lines to print, [{ t: text, c: class }]
// (c: '' plain, 'e' an error, 'd' dim, 'h' a heading, 'g' good news, 'w' a warning). `complete(text)` is the
// Tab key; `chips(text)` is the row of things to tap, so that everything can be done without a keyboard:
// commands first, then, once a command wants a name, the names in the folder.
//
// What the desk gives it (env): systems() -> { list(), run(id, args) } or null; bots(), mice() -> rows;
// clock() -> 'HH:MM'; edit(node) opens the editor; app(name) opens 'tracker' or 'donut'; exit(); clear();
// read(node) is told when a file has been read; unlock() when clearance 9 is given; seen() -> which halves
// of the password have been seen on their sticky notes; sound(name) for the few jokes that make a noise.

import { HOME, LOCKED, HALVES, checkPassword } from './secfiles.js';

export const EXPECTED = ['sprinklers', 'firetest', 'lights', 'lift', 'doors', 'pa'];      // the systems src/systems.js is expected to list
const WIDE = 46;
const pad = (s, n) => (String(s) + ' '.repeat(n)).slice(0, Math.max(n, String(s).length));
const WRONG = [
  'Wrong.',
  'Also wrong. It is not "password".',
  'No. Dave wrote it on sticky notes. Two of them.',
  'No. One note on each control room\'s monitor.',
  'Still no. This is the part where a real computer locks you out. This one cannot be bothered.',
];
const UNKNOWN = [
  c => `${c}: not a command. Neither is shouting at it.`,
  c => `${c}: no. Try  help.`,
  c => `${c}: the computer does not know that one. The computer knows eleven things.`,
  c => `${c}: command not found. Checked under the desk as well.`,
  c => `${c}: nothing by that name. It is a quiet night. Try  help.`,
];

export class Term {
  constructor(vfs, env = {}) { this.fs = vfs; this.env = env; this.cwd = HOME; this.hist = []; this.mode = null; this.tries = 0; this.unk = 0; }
  get where() { return this.cwd === HOME ? '~' : this.cwd.startsWith(HOME + '/') ? '~' + this.cwd.slice(HOME.length) : this.cwd; }
  get prompt() { return this.mode === 'password' ? 'CLEARANCE 9 password: ' : `nightshift:${this.where}$ `; }
  sys() { try { const s = this.env.systems && this.env.systems(); return s && typeof s.list === 'function' && typeof s.run === 'function' ? s : null; } catch { return null; } }
  sysList() { const s = this.sys(); try { return s ? (s.list() || []).filter(q => q && q.id) : []; } catch { return []; } }

  // ---------------------------------------------------------------- one line typed
  async run(line) {
    const out = [], say = (t = '', c = '') => { for (const l of String(t).split('\n')) out.push({ t: l, c }); };
    line = String(line || '').trim();
    if (this.mode === 'password') { this.mode = null; if (!line || /^(cancel|exit|quit)$/i.test(line)) say('Login cancelled.', 'd'); else this._login(line, say); return out; }
    if (!line) return out;
    this.hist.push(line); if (this.hist.length > 60) this.hist.shift();
    // cd.. and cd\ are one word to a certain kind of typist
    line = line.replace(/^(cd|dir|ls)(\.\.|\\|\/)/i, '$1 $2');
    const tok = line.match(/"[^"]*"|'[^']*'|\S+/g).map(s => s.replace(/^["']|["']$/g, ''));
    const cmd = tok[0].toLowerCase().replace(/\.exe$/, ''), args = tok.slice(1), rest = line.slice(tok[0].length).trim();
    const flags = args.filter(a => /^-\w+$|^\/[a-zA-Z?]$/.test(a)).join('').toLowerCase(), names = args.filter(a => !/^-\w+$|^\/[a-zA-Z?]$/.test(a));
    const fs = this.fs, at = p => fs.node(this.cwd, p), denied = () => { say('Permission denied: CLEARANCE 9', 'e'); say('(Facilities\' folder. Try:  login)', 'd'); };
    const rel = n => (n.path.startsWith(this.cwd === '/' ? '/' : this.cwd + '/') ? n.path.slice(this.cwd === '/' ? 1 : this.cwd.length + 1) : n.path);
    const cat = () => {
      if (!names.length) return say(`${cmd}: which file?  (ls shows them)`, 'e');
      for (const p of names) {
        const n = at(p);
        if (!n) say(`${cmd}: ${p}: no such file. (ls shows what there is.)`, 'e');
        else if (fs.locked(n)) denied();
        else if (n.dir) say(`${cmd}: ${n.name || '/'}: that is a folder. Try:  cd ${p}`, 'e');
        else { say(fs.read(n).replace(/\n$/, '')); if (this.env.read) this.env.read(n); }
      }
    };
    const open = () => {
      if (!names.length) return say(`${cmd}: open what?  (a file's name, or: tracker, donut)`, 'e');
      const p = names[0], n = at(p);
      if (!n && /^(tracker|map|donut|game)$/i.test(p)) { say(`Opening ${p}.`, 'd'); if (this.env.app) this.env.app(/^(tracker|map)$/i.test(p) ? 'tracker' : 'donut'); return; }
      if (!n) return say(`${cmd}: ${p}: no such file.`, 'e');
      if (fs.locked(n)) return denied();
      if (n.dir) { this.cwd = n.path; return say(`${n.path}: a folder. You are in it now.`, 'd'); }
      say(`Opening ${n.name} in the editor${n.f.edit ? '' : ' (read only)'}.`, 'd');
      if (/^(vi|vim|emacs)$/.test(cmd)) say(`(Not really ${cmd}. You can leave whenever you like.)`, 'd');
      if (this.env.edit) this.env.edit(n);
      if (this.env.read) this.env.read(n);
    };
    const ro = what => say(`${cmd}: ${what} The night shift has a read-only night. (Two files can be changed: open notes.txt)`, 'e');
    const C = {
      help: () => {
        const one = names.length && this.sysList().find(q => String(q.id).toLowerCase() === names[0].toLowerCase());
        if (one) { say(`${one.id} · ${one.name || 'building system'}`, 'h'); say(` ${one.usage || one.id}`); if (one.about) say(` ${one.about}`, 'd'); return; }
        say(`WATCHMAN 4.1 · what it understands
 ls, dir          what is in this folder
 cd <folder>      go in.  cd ..  back out
                  cd /  the top.  cd ~  home
 pwd              where am I
 cat <file>       read it here (type, more)
 open <file>      read it in the editor
                  (edit, nano, notepad)
 grep <word>      search every file from here
 tree             the folders, drawn
 bots  mice  cams who is about tonight
 tracker          the floor plan, live
 systems          the building's switches
 login            clearance 9, if you know it
 whoami  date  history  clear  exit
 help <system>    how one of them is worked
Tab finishes a name. Up: the last command.`);
      },
      pwd: () => say(this.cwd),
      ls: () => {
        const n = names.length ? at(names[0]) : at('.');
        if (!n) return say(`${cmd}: ${names[0]}: no such file or folder`, 'e');
        if (fs.locked(n)) return denied();
        if (!n.dir) return say(n.name);
        const list = fs.list(n, /a/.test(flags)), label = k => k.name + (k.dir ? '/' : '');
        if (!list.length) return say('(empty)', 'd');
        if (cmd === 'dir' || /l/.test(flags)) {
          if (cmd === 'dir') say(` Directory of ${n.path}`, 'd'), say('');
          for (const k of list) say(k.dir ? `${cmd === 'dir' ? '<DIR>    ' : 'd  -     '} ${label(k)}${fs.locked(k) ? '   [CLEARANCE 9]' : ''}` : `${cmd === 'dir' ? '    ' : '-  '}${pad(String(fs.read(k).length), 5)} ${k.name}${k.f.edit ? '   (yours to edit)' : ''}`, k.dir ? 'h' : '');
          if (cmd === 'dir') say(`     ${list.filter(k => !k.dir).length} file(s), ${list.filter(k => k.dir).length} folder(s)`, 'd');
          return;
        }
        const w = Math.max(...list.map(k => label(k).length)) + 2, per = Math.max(1, Math.floor(WIDE / w));
        for (let i = 0; i < list.length; i += per) say(list.slice(i, i + per).map(k => pad(label(k), w)).join('').trimEnd());
        if (list.some(k => fs.locked(k))) say(`(${LOCKED.slice(1)}/ is locked: CLEARANCE 9)`, 'd');
      },
      cd: () => {
        if (!names.length) { this.cwd = HOME; return; }
        const n = at(names[0]);
        if (!n) return say(`cd: ${names[0]}: no such folder. (ls shows what there is.)`, 'e');
        if (fs.locked(n)) return denied();
        if (!n.dir) return say(`cd: ${n.name}: that is a file. Try:  cat ${names[0]}`, 'e');
        this.cwd = n.path;
      },
      cat, open,
      tree: () => {
        const n = names.length ? at(names[0]) : at('.');
        if (!n || !n.dir) return say('tree: no such folder', 'e');
        if (fs.locked(n)) return denied();
        say(n.path, 'h');
        const walk = (d, ind) => { const list = fs.list(d); list.forEach((k, i) => { const last = i === list.length - 1; say(ind + (last ? '`-- ' : '|-- ') + k.name + (k.dir ? '/' : '') + (fs.locked(k) ? '  [CLEARANCE 9]' : ''), k.dir ? 'h' : ''); if (k.dir && !fs.locked(k)) walk(k, ind + (last ? '    ' : '|   ')); }); };
        walk(n, '');
      },
      grep: () => {
        const word = (names[0] || '').toLowerCase(), from = names[1] ? at(names[1]) : at('.');
        if (!word) return say(`${cmd}: search for what?  e.g.  grep green`, 'e');
        if (!from) return say(`${cmd}: no such folder`, 'e');
        if (fs.locked(from)) return denied();
        let n = 0; const files = from.dir ? fs.walk(from) : [from];
        for (const f of files) for (const l of fs.read(f).split('\n')) if (l.toLowerCase().includes(word)) { if (++n <= 14) say(`${rel(f)}: ${l.trim()}`); }
        if (!n) say(`${cmd}: "${names[0]}": not a word in any file from here down.`, 'd'); else if (n > 14) say(`(and ${n - 14} more. Try a folder nearer.)`, 'd');
        if (!this.fs.clearance && this.cwd === '/') say('(not searched: /sublevel9. CLEARANCE 9.)', 'd');
      },
      whoami: () => say(this.fs.clearance ? 'nightshift (clearance 9. apparently.)' : 'nightshift (clearance 2)'),
      who: () => say(`nightshift  desk   since 22:00\nitem12      LIFT   since 03:40  (?)`),
      date: () => { const t = this.env.clock ? this.env.clock() : '02:10'; say(t >= '05:59' ? 'It is 05:59. It has been 05:59 for some time.' : `It is ${t}. Night shift. Sunrise: not soon.`); },
      clear: () => { if (this.env.clear) this.env.clear(); },
      history: () => this.hist.forEach((h, i) => say(`${String(i + 1).padStart(3)}  ${h}`)),
      exit: () => { say('Logged off. (You are still on shift.)', 'd'); if (this.env.exit) this.env.exit(); },
      echo: () => say(rest),
      login: () => { if (this.fs.clearance) return say('You already have clearance 9. Nobody has noticed. Keep it that way.', 'd'); if (names.length) return this._login(names.join(''), say); this.mode = 'password'; say('CLEARANCE 9. Password?', 'h'); },
      logout: () => say('You are the night shift. You may not log out until it is morning.', 'd'),
      systems: () => {
        const list = this.sysList();
        if (!list.length) { say('BUILDING SYSTEMS: link down.', 'e'); say('(Facilities are "looking into it".)', 'd'); return; }
        say('BUILDING SYSTEMS', 'h');
        for (const s of list) { say(` ${pad(s.usage || s.id, 22)} ${s.name || ''}`); if (s.about) say(`   ${s.about}`, 'd'); }
      },
      bots: () => {
        const rows = this.env.bots ? this.env.bots() : [];
        if (!rows.length) return say('ROBOTS: all units docked.', 'd');
        say('UNIT      LVL  ROOM            STATE', 'h');
        for (const b of rows) say(`${pad(b.id, 9)} ${pad(b.level, 4)} ${pad(b.room, 15)} ${b.state}`, b.hot ? 'e' : b.warm ? 'w' : '');
        const low = rows.filter(b => String(b.level) === 'LL');
        say(low.length ? `${rows.length} units. ${low.map(b => b.id).join(', ')} below level 1, which they never are. Somebody said "donuts".` : `${rows.length} units. None below level 1: they will not go.`, 'd');
      },
      mice: () => {
        const rows = this.env.mice ? this.env.mice() : [];
        say('RODENTS (LUMINOUS) · tagged by pest control', 'h');
        if (!rows.length) return say(' none on the board.', 'd');
        for (const m of rows) say(` ${pad(m.id, 3)} ${pad(m.wing, 24)} ${m.state}`, 'g');
        say('Pest control no longer take our calls.', 'd');
      },
      cams: () => { const n = at('/cameras/camlist.txt'); if (n) say(fs.read(n).replace(/\n$/, '')); },
      tracker: () => { say('Opening the Tracker.', 'd'); if (this.env.app) this.env.app('tracker'); },
      donut: () => { say('There is no donut game on this computer.', 'd'); say('Opening the donut game.', 'd'); if (this.env.app) this.env.app('donut'); },
      // ---- for people who try things ----
      sudo: () => say('nightshift is not in the sudoers file.\nThis incident will be reported.\n(To you. You are security.)', 'w'),
      rm: () => say(`${cmd}: the night shift may not delete evidence.\nNice try. Logged.`, 'w'),
      format: () => { say('Formatting C: ...  3% ... 7% ... 12% ...'); say('Only joking. There is no C:. There is barely a computer.', 'd'); },
      ping: () => {
        const who = names[0] || 'sublevel9';
        if (/sub|sl9|below|9/i.test(who)) { say(`PING ${who}: there is no such host.`); 'D G B A E'.split(' ').forEach((n, i) => say(` reply ${i + 1} from below: ${n}   time=12 m`, 'g')); say('5 sent. 5 answered. Nobody is down there to answer.', 'd'); if (this.env.sound) this.env.sound('motif'); }
        else { say(`PING ${who}: 4 sent, 0 back.`); say('It is the middle of the night. Everything sensible is asleep.', 'd'); }
      },
      shutdown: () => say(`${cmd}: the night shift does not end early.\nNice try.`, 'w'),
      mkdir: () => ro('no.'),
      uname: () => say('WATCHMAN 4.1 (municipal). Last updated: before your time.'),
      coffee: () => say('The machine owes you 75 cents. See ticket 4540.', 'd'),
      hello: () => say('Good evening. It is the middle of the night.', 'd'),
      please: () => say('Politeness noted. Still no.', 'd'),
      thanks: () => say('You are welcome. Nobody else says that to it.', 'd'),
      sl: () => say('A train goes by. (That is the 02:10. It is always the 02:10.)', 'd'),
      xyzzy: () => { say('Nothing happens.'); say('Far below, something hums.', 'g'); },
    };
    const ALIAS = { dir: 'ls', ll: 'ls', la: 'ls', type: 'cat', more: 'cat', less: 'cat', head: 'cat', tail: 'cat', edit: 'open', nano: 'open', notepad: 'open', vi: 'open', vim: 'open', emacs: 'open', pico: 'open', start: 'open', view: 'open',
      '?': 'help', man: 'help', commands: 'help', cls: 'clear', quit: 'exit', bye: 'exit', logoff: 'exit', time: 'date', find: 'grep', findstr: 'grep', search: 'grep', chdir: 'cd', robots: 'bots', guards: 'bots', units: 'bots', rodents: 'mice', mouse: 'mice',
      cameras: 'cams', cctv: 'cams', map: 'tracker', game: 'donut', donuts: 'donut', su: 'sudo', del: 'rm', erase: 'rm', rmdir: 'rm', rd: 'rm', reboot: 'shutdown', halt: 'shutdown', poweroff: 'shutdown', restart: 'shutdown', touch: 'mkdir', cp: 'mkdir', mv: 'mkdir', copy: 'mkdir', move: 'mkdir', ren: 'mkdir', md: 'mkdir',
      ver: 'uname', version: 'uname', hi: 'hello', hey: 'hello', thankyou: 'thanks', ta: 'thanks', system: 'systems', sys: 'systems', password: 'login', passwd: 'login', w: 'who' };
    const name = C[cmd] ? cmd : ALIAS[cmd];
    // The building's own switches, by their ids (and `run <id>`).
    const sysId = cmd === 'run' && names.length ? names[0].toLowerCase() : cmd, sysArgs = cmd === 'run' ? args.slice(1) : args;
    const system = this.sysList().find(s => String(s.id).toLowerCase() === sysId);
    if (system) {
      try {
        const r = await this.sys().run(system.id, sysArgs) || {};
        for (const l of r.lines || [r.ok ? 'Done.' : `${system.id}: no reply from the panel.`]) say(l, r.ok === false ? 'w' : '');
        if (this.env.sound) this.env.sound(r.sound || (r.ok === false ? 'no' : 'ok'), r);
      } catch (e) { say(`${system.id}: no reply from the panel.`, 'e'); }
    } else if (EXPECTED.includes(sysId)) { say(`${sysId}: system offline.`, 'e'); say('(Facilities are "looking into it".)', 'd'); }
    else if (name) await C[name]();
    else if (/^\.{1,2}$/.test(cmd)) { this.cwd = fs.norm(this.cwd, cmd); }
    else if (tok.length === 1 && tok[0].length > 2 && at(tok[0])) { const n = at(tok[0]); if (fs.locked(n)) denied(); else if (n.dir) this.cwd = n.path; else { say(`(${n.name} is a file. Reading it.)`, 'd'); say(fs.read(n).replace(/\n$/, '')); if (this.env.read) this.env.read(n); } }      // a bare name: go in, or read it
    else say(UNKNOWN[this.unk++ % UNKNOWN.length](tok[0]), 'e');
    return out;
  }
  _login(pw, say) {
    const r = checkPassword(pw);
    if (r === 'ok') { this.fs.clearance = true; say('CLEARANCE 9 ACCEPTED.', 'g'); say('Welcome back, Director.', 'g'); say('(You are not the Director. The computer cannot tell. It is a computer.)', 'd'); say(`Try:  cd ${LOCKED}`, 'd'); if (this.env.unlock) this.env.unlock(); if (this.env.sound) this.env.sound('unlock'); }
    else if (r === 'half') { say('That is half of it.', 'w'); say('The other half is on the other control room\'s monitor.', 'd'); if (this.env.sound) this.env.sound('no'); }
    else { say(WRONG[Math.min(this.tries++, WRONG.length - 1)], 'e'); if (this.env.sound) this.env.sound('no'); }
  }

  // ---------------------------------------------------------------- names, for Tab and for tapping
  // The commands worth offering, in the order a new hand would want them.
  commands() { return ['ls', 'cd', 'cat', 'open', 'help', 'bots', 'mice', 'cams', 'tracker', 'systems', ...this.sysList().map(s => String(s.id)), ...(this.fs.clearance ? [] : ['login']), 'grep', 'tree', 'pwd', 'whoami', 'date', 'history', 'clear', 'exit']; }
  // What a half-typed path could be: { dir (the part already typed, with its slash), list: [nodes] }.
  _names(part, want) {
    const cut = part.lastIndexOf('/'), dir = cut >= 0 ? part.slice(0, cut + 1) : '', stem = part.slice(cut + 1).toLowerCase();
    const n = this.fs.node(this.cwd, dir || '.');
    if (!n || !n.dir || this.fs.locked(n)) return { dir, list: [] };
    return { dir, list: this.fs.list(n, stem.startsWith('.')).filter(k => k.name.toLowerCase().startsWith(stem) && (want === 'any' || k.dir)) };
  }
  _wants(cmd) { cmd = cmd.toLowerCase(); return /^(cd|chdir|tree)$/.test(cmd) ? 'dir' : /^(ls|dir|ll|grep|find)$/.test(cmd) ? 'any' : /^(cat|type|more|less|head|tail|open|edit|nano|notepad|vi|vim|emacs|pico|start|view)$/.test(cmd) ? 'path' : null; }
  // Tab: finish the word being typed if there is one way to, or as far as they all agree. Returns { text, options }.
  complete(text) {
    if (this.mode) return { text, options: [] };
    const m = text.match(/^(\s*)(\S*)(\s+)?(.*)$/), cmd = m[2], argPart = m[3] ? m[4] : null;
    if (argPart === null) {
      const c = this.commands().filter(q => q.startsWith(cmd.toLowerCase()));
      if (c.length === 1) return { text: c[0] + ' ', options: [] };
      return { text: c.length ? common(c) : text, options: c };
    }
    const want = this._wants(cmd); if (!want) return { text, options: [] };
    const last = argPart.split(/\s+/).pop(), head = text.slice(0, text.length - last.length);
    const { dir, list } = this._names(last, want === 'dir' ? 'dir' : 'any');
    if (!list.length) return { text, options: [] };
    if (list.length === 1) return { text: head + dir + list[0].name + (list[0].dir ? '/' : ' '), options: [] };
    return { text: head + dir + common(list.map(k => k.name)), options: list.map(k => k.name + (k.dir ? '/' : '')) };
  }
  // The row to tap. Each is { label, text (what the line becomes), run (and is entered at once) }.
  chips(text) {
    if (this.mode === 'password') {
      const seen = this.env.seen ? this.env.seen() : [false, false], typed = text.toUpperCase();
      const out = HALVES.filter((h, i) => seen[i]).map(h => ({ label: h, text: typed + h, run: false }));
      if (!out.length) out.push({ label: 'no idea', text: '', run: true });
      if (text) out.push({ label: 'enter', text, run: true }, { label: 'rub out', text: '', run: false });
      out.push({ label: 'cancel', text: 'cancel', run: true });
      return out;
    }
    const m = text.match(/^(\s*)(\S*)(\s+)?(.*)$/), cmd = m[2].toLowerCase(), argPart = m[3] ? m[4] : null, out = [];
    const takes = { cd: 1, cat: 1, open: 1, grep: 1 };
    if (argPart === null) {
      for (const c of this.commands()) if (c.startsWith(cmd)) out.push({ label: c, text: takes[c] ? c + ' ' : c, run: !takes[c] });
      if (text) out.unshift({ label: 'enter', text, run: true });
      return out;
    }
    const sys = this.sysList().find(s => String(s.id).toLowerCase() === cmd);
    if (sys) {
      // what its usage line offers: <on|off|status>
      const u = String(sys.usage || ''), opts = new Set();
      for (const g of u.match(/[<\[][^>\]]+[>\]]/g) || []) if (g.includes('|')) for (const w of g.slice(1, -1).split('|')) if (/^[\w-]+$/.test(w.trim())) opts.add(w.trim());      // (a choice is offered; a <name> is not)
      // and the places it can be pointed at, if it says what they are (zones for the sprinklers, wings for the fire test and the lights)
      const places = fn => { try { const S = this.sys(); return (S && typeof S[fn] === 'function' ? S[fn]() || [] : []).map(q => String(q && typeof q === 'object' ? q.id || q.name || '' : q)).filter(Boolean); } catch { return []; } };
      if (/zone/i.test(u) || sys.id === 'sprinklers') for (const w of places('zones')) opts.add(w);
      if (/wing/i.test(u) || sys.id === 'firetest' || sys.id === 'lights') for (const w of places('wings')) opts.add(w);
      out.push({ label: 'enter', text, run: true });
      const stem = argPart.split(/\s+/).pop().toLowerCase();
      for (const w of opts) if (w.toLowerCase().startsWith(stem)) out.push({ label: w, text: text.slice(0, text.length - stem.length) + (/\s/.test(w) ? `"${w}"` : w), run: true });
      return out;
    }
    if (cmd === 'grep' || cmd === 'find') { for (const w of ['green', 'grate', 'lift', 'label', 'crate', 'Director', 'notes', 'donut']) out.push({ label: w, text: `${cmd} ${w}`, run: true }); return out; }
    const want = this._wants(cmd);
    if (want) {
      const last = argPart.split(/\s+/).pop(), head = text.slice(0, text.length - last.length), { dir, list } = this._names(last, want === 'dir' ? 'dir' : 'any');
      if (want === 'dir' && !last) for (const p of ['..', '/', '~']) if (this.fs.norm(this.cwd, p) !== this.cwd) out.push({ label: p, text: head + p, run: true });
      for (const k of list) {
        const locked = this.fs.locked(k);
        if (k.dir) out.push({ label: k.name + '/' + (locked ? ' (locked)' : ''), text: head + dir + k.name + (want === 'path' ? '/' : ''), run: want !== 'path' });      // (to read a file in a folder: tap the folder, then the file)
        else out.push({ label: k.name, text: head + dir + k.name, run: true });
      }
      if (want === 'path' && last && last.endsWith('/')) out.unshift({ label: '..', text: head + last.replace(/[^/]+\/$/, ''), run: false });
    }
    if (text.trim()) out.unshift({ label: 'enter', text, run: true });
    out.push({ label: 'rub out', text: '', run: false });
    return out;
  }
}
function common(list) { let p = list[0] || ''; for (const s of list) while (!s.toLowerCase().startsWith(p.toLowerCase())) p = p.slice(0, -1); return p; }
