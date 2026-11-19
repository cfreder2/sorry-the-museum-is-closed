// Trophies, the way a console keeps them: bronze, silver and gold, and one platinum for earning
// all the others. Mostly for seeing art. They are kept on the device for good: a new game does
// not take them away.
//
// Each trophy is a line in TROPHIES with a test over a snapshot of the game (`snap`, below) that
// main.js takes about twice a second. One with a `goal` is counted and shows a bar. One whose
// `needs` finds nothing in tonight's hang (a famous picture not on view) is left out altogether,
// platinum included, so the list always fits the collection.

const KEY = 'after-hours.trophies';
export const TIERS = { bronze: { name: 'Bronze', colour: '#c98a52', worth: 15 }, silver: { name: 'Silver', colour: '#cfd6dd', worth: 30 }, gold: { name: 'Gold', colour: '#f1c84b', worth: 90 }, platinum: { name: 'Platinum', colour: '#a9e4f5', worth: 0 } };

const title = re => m => m.arts.filter(a => re.test(a.work.t || ''));
const seenAny = id => s => s.famous[id] && s.famous[id].some(a => a.seen);
const inRoom = re => s => !!s.room && re.test(s.room.gallery || '');
const works = n => ({ goal: n, count: s => s.seen, test: s => s.seen >= n, needs: m => (m.arts.length >= n ? [1] : []) });

export const TROPHIES = [
  // ---- bronze ----
  { id: 'in', tier: 'bronze', name: 'After Hours', desc: 'Find a way into the building.', test: s => s.inside },
  { id: 'first', tier: 'bronze', name: 'First Impression', desc: 'See your first work of art.', test: s => s.seen >= 1 },
  { id: 'w10', tier: 'bronze', name: 'A Good Start', desc: 'See 10 different works.', ...works(10) },
  { id: 'room', tier: 'bronze', name: 'The Whole Room', desc: 'See every work in one room.', test: s => s.roomsDone >= 1 },
  { id: 'levels', tier: 'bronze', name: 'Upstairs, Downstairs', desc: 'See a work on every level of the building.', goal: 0, count: s => s.levels.filter(l => l.seen > 0).length, total: s => s.levels.length, test: s => s.levels.length > 0 && s.levels.every(l => l.seen > 0) },
  { id: 'stairs', tier: 'bronze', name: 'The Grand Staircase', desc: 'Get to the top of the Grand Staircase.', test: s => !!s.room && s.room.id === 'G200' && s.y > s.room.y + 4.6 && s.grounded },
  { id: 'griffin', tier: 'bronze', name: 'Coloured Light', desc: 'Stand under the coloured roof of Griffin Court.', test: s => !!s.room && s.room.kind === 'hall' },
  { id: 'thorne', tier: 'bronze', name: 'One Inch to the Foot', desc: 'See one of the Thorne Miniature Rooms.', needs: m => m.arts.filter(a => a.mini), test: seenAny('thorne') },
  { id: 'chagall', tier: 'bronze', name: 'America Windows', desc: 'Find the gallery of the Chagall windows.', test: s => inRoom(/chagall/i)(s) || seenAny('chagall')(s), needs: m => title(/america windows/i)(m), always: true },
  { id: 'stunt', tier: 'bronze', name: 'Stunt Look', desc: 'Look at a work of art from mid-air.', test: s => s.stunts >= 1 },
  { id: 'studio', tier: 'bronze', hidden: true, name: 'Under the Lamp', desc: 'Find a conservation studio.', test: inRoom(/conservation/i) },
  { id: 'dock', tier: 'bronze', hidden: true, name: 'Tradesman’s Entrance', desc: 'Find the loading dock.', test: inRoom(/loading dock/i) },
  { id: 'boiler', tier: 'bronze', hidden: true, name: 'Below Stairs', desc: 'Find the boiler room.', test: inRoom(/boiler/i) },
  { id: 'office', tier: 'bronze', hidden: true, name: 'The Corner Office', desc: 'Find the director’s office.', test: inRoom(/director.s office/i) },
  { id: 'cards', tier: 'bronze', hidden: true, name: 'A Friend in Need', desc: 'Sit in at the card game on the roof.', test: s => s.flags.cards },
  { id: 'goal', tier: 'bronze', hidden: true, name: 'He Shoots', desc: 'Score a goal on the hockey pond.', test: s => s.flags.goal },
  // ---- silver ----
  { id: 'w50', tier: 'silver', name: 'Regular Visitor', desc: 'See 50 different works.', ...works(50) },
  { id: 'w100', tier: 'silver', name: 'Member', desc: 'See 100 different works.', ...works(100) },
  { id: 'jatte', tier: 'silver', name: 'Sunday in the Park', desc: 'See Seurat’s A Sunday on La Grande Jatte.', needs: m => { const a = title(/grande jatte/i)(m), b = a.filter(x => !/sketch|study/i.test(x.work.t)); return b.length ? b : a; }, test: seenAny('jatte') },
  { id: 'bedroom', tier: 'silver', name: 'A Room in Arles', desc: 'See Van Gogh’s The Bedroom.', needs: title(/^the bedroom\b/i), test: seenAny('bedroom') },
  { id: 'lilies', tier: 'silver', name: 'Giverny', desc: 'See Monet’s Water Lilies.', needs: title(/water lil/i), test: seenAny('lilies') },
  { id: 'hawks', tier: 'silver', name: 'Night Owls', desc: 'See Hopper’s Nighthawks.', needs: title(/nighthawks/i), test: seenAny('hawks') },
  { id: 'gothic', tier: 'silver', name: 'Pitchfork', desc: 'See Grant Wood’s American Gothic.', needs: title(/american gothic/i), test: seenAny('gothic') },
  { id: 'bullet', tier: 'silver', name: 'Bullet Time', desc: 'Land a Stunt Look in slow motion.', test: s => s.bullet >= 1 },
  { id: 'combo', tier: 'silver', name: 'Diptych', desc: 'Stunt Look two different works in one jump.', test: s => s.combo >= 2 },
  { id: 'snow', tier: 'silver', name: 'No Snowman Left Standing', desc: 'Knock down every snowman in the grounds in one visit.', goal: 0, count: s => s.snowmen, total: s => s.snowmenAll, test: s => s.snowmenAll > 0 && s.snowmen >= s.snowmenAll },
  { id: 'pond', tier: 'silver', hidden: true, name: 'Pond Champion', desc: 'Beat the blue car at pond hockey.', test: s => s.flags.pond },
  // ---- gold ----
  { id: 'w250', tier: 'gold', name: 'Connoisseur', desc: 'See 250 different works.', ...works(250) },
  { id: 'w500', tier: 'gold', name: 'Curator', desc: 'See 500 different works.', ...works(500) },
  { id: 'level', tier: 'gold', name: 'A Whole Floor', desc: 'See every work in every room on one level.', test: s => s.levels.some(l => l.rooms > 0 && l.done === l.rooms) },
  { id: 'hoops', tier: 'gold', name: 'Every Hoop', desc: 'Go through every hoop in the building in one visit.', goal: 0, count: s => s.hoops, total: s => s.hoopsAll, test: s => s.hoopsAll > 0 && s.hoops >= s.hoopsAll },
  { id: 'stunts', tier: 'gold', name: 'Stunt Curator', desc: 'Land 25 Stunt Looks.', goal: 25, count: s => s.stunts, test: s => s.stunts >= 25 },
  { id: 'score', tier: 'gold', name: 'High Art', desc: 'Reach an Art Score of 25,000.', goal: 25000, count: s => s.score, test: s => s.score >= 25000 },
  // ---- platinum ----
  { id: 'all', tier: 'platinum', name: 'Keyholder', desc: 'Earn every other trophy.' },
];

const CUP = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M9 4h14v2h5v4a6 6 0 0 1-6 6h-.7A7 7 0 0 1 17.5 19v4H21a2 2 0 0 1 2 2v3H9v-3a2 2 0 0 1 2-2h3.5v-4A7 7 0 0 1 10.700 16H10a6 6 0 0 1-6-6V6h5zm0 4H6v2a4 4 0 0 0 3.300 3.900A9 9 0 0 1 9 12zm14 0v4a9 9 0 0 1-.3 1.900A4 4 0 0 0 26 10V8z"/></svg>';
const KEYICON = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M11 9a7 7 0 1 0 6.300 10H21v3h4v-3h3v-4H17.700A7 7 0 0 0 11 9zm-1 4.500a2.500 2.500 0 1 1 0 5 2.500 2.500 0 0 1 0-5z"/></svg>';
const WHEEL = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M5 20v-5l3-1 3-5h9l4 5 4 1v6h-3a3.500 3.500 0 0 1-7 0h-4a3.500 3.500 0 0 1-7 0zm8-9-2 3h8l-2-3zm-4.500 9a1.500 1.500 0 1 0 0 3 1.500 1.500 0 0 0 0-3zm11 0a1.500 1.500 0 1 0 0 3 1.500 1.500 0 0 0 0-3z"/></svg>';

// ---------------------------------------------------------------- toasts ---
// A card that slides in at the top left, console fashion. Used for trophies and for a new vehicle.
const queue = [];
let showing = false;
export function toast(t) { queue.push(t); if (!showing) next(); }
function next() {
  const el = document.getElementById('trophyToast'), t = queue.shift();
  if (!el || !t) { showing = false; return; }
  showing = true;
  el.className = t.tier || 'vehicle';
  el.querySelector('.ico').innerHTML = t.tier === 'platinum' ? KEYICON : t.tier ? CUP : WHEEL;
  el.querySelector('.h').textContent = t.head;
  el.querySelector('.n').textContent = t.name;
  el.hidden = false;
  void el.offsetWidth;
  el.classList.add('on');
  if (t.sound) t.sound();
  setTimeout(() => { el.classList.remove('on'); setTimeout(() => { el.hidden = true; next(); }, 450); }, t.hold || 4200);
}

// -------------------------------------------------------------- trophies ---

export class Trophies {
  constructor() {
    this.earned = {};                // id -> when (ms)
    this.flags = {};                 // things that happened once and cannot be read back off the game
    this.list = TROPHIES;            // those that tonight's hang allows
    this.famous = {};
    this.onEarn = null;              // (trophy)
    this.isOpen = false;
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) { Object.assign(this.earned, s.earned); Object.assign(this.flags, s.flags); } } catch { /* no storage */ }
  }
  save() { try { localStorage.setItem(KEY, JSON.stringify({ earned: this.earned, flags: this.flags })); } catch { /* fine */ } }
  has(id) { return !!this.earned[id]; }
  get ids() { return new Set(Object.keys(this.earned)); }
  flag(name) { if (!this.flags[name]) { this.flags[name] = 1; this.save(); } }

  /** Fit the list to the building and tonight's hang. A trophy already earned always stays on it. */
  setup(museum) {
    this.famous = {};
    this.list = TROPHIES.filter(t => {
      if (!t.needs) return true;
      const found = t.needs(museum);
      this.famous[t.id] = found;
      return found.length > 0 || t.always || this.has(t.id);
    });
    this.levels = [...new Set(museum.galleries.map(st => st.room.floor))];
  }

  /** What the tests look at. `G` is the game; `score` its Score. */
  snap(G, score) {
    const m = G.museum, v = G.vehicle;
    const levels = (this.levels || []).map(f => ({ floor: f, rooms: 0, done: 0, seen: 0 }));
    let roomsDone = 0;
    for (const st of m.galleries) {
      const l = levels.find(x => x.floor === st.room.floor);
      if (st.done) roomsDone++;
      if (l) { l.rooms++; if (st.done) l.done++; l.seen += st.seen; }
    }
    return {
      seen: m.seenCount, total: m.arts.length, roomsDone, levels, famous: this.famous, flags: this.flags,
      room: G.roomId ? G.plan.byId[G.roomId] : null, y: v.pos.y, grounded: v.kind !== 'car' || !v.air,
      inside: !G.plan.locked && G.mode === 'explore' && !!G.roomId,
      stunts: score.s.stunts, bullet: score.s.bullet, combo: score.s.combo, score: score.s.score,
      hoops: m.hoopsDone, hoopsAll: m.hoops.length, snowmen: G.props.busted, snowmenAll: G.props.snowmen,
    };
  }

  /** Award whatever the snapshot has earned. */
  check(s) {
    this.last = s;
    let any = false;
    for (const t of this.list) {
      if (this.earned[t.id] || !t.test) continue;
      let ok = false; try { ok = !!t.test(s); } catch { ok = false; }
      if (ok) { this._earn(t); any = true; }
    }
    const rest = this.list.filter(t => t.tier !== 'platinum');
    if (!this.earned.all && rest.length && rest.every(t => this.earned[t.id])) { this._earn(this.list.find(t => t.id === 'all')); any = true; }
    if (any) { this.save(); if (this.isOpen) this.render(); }
    return any;
  }
  _earn(t) {
    if (!t) return;
    this.earned[t.id] = Date.now();
    if (this.onEarn) this.onEarn(t);
  }

  totals() {
    const by = {}; let pts = 0, max = 0, n = 0;
    for (const k in TIERS) by[k] = { got: 0, of: 0 };
    for (const t of this.list) { by[t.tier].of++; max += TIERS[t.tier].worth; if (this.earned[t.id]) { by[t.tier].got++; pts += TIERS[t.tier].worth; n++; } }
    return { by, n, of: this.list.length, pct: max ? Math.floor(100 * pts / max) : 0 };
  }

  // ---- the screen ----
  render() {
    const $ = id => document.getElementById(id), grid = $('trGrid'), s = this.last;
    if (!grid) return;
    const tot = this.totals();
    $('trPct').textContent = `${tot.pct}%`;
    $('trBar').style.width = tot.pct + '%';
    $('trSum').replaceChildren(...Object.entries(TIERS).reverse().map(([k, T]) => {
      const d = document.createElement('span'); d.className = 'tier ' + k;
      d.innerHTML = CUP + `<b>${tot.by[k].got}</b> / ${tot.by[k].of}<i>${T.name}</i>`;
      d.setAttribute('aria-label', `${T.name}: ${tot.by[k].got} of ${tot.by[k].of}`);
      return d;
    }));
    const order = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
    // Those earned come first, the latest at the top; then the rest, the grandest first.
    const rows = [...this.list].sort((a, b) => (this.earned[b.id] || 0) - (this.earned[a.id] || 0) || order[a.tier] - order[b.tier]);
    grid.replaceChildren(...rows.map(t => {
      const got = this.earned[t.id], secret = t.hidden && !got;
      const li = document.createElement('li'); li.className = `tr ${t.tier}${got ? ' got' : ''}${secret ? ' secret' : ''}`;
      const ico = document.createElement('span'); ico.className = 'ico'; ico.innerHTML = t.tier === 'platinum' ? KEYICON : CUP;
      const body = document.createElement('div'); body.className = 'b';
      const n = document.createElement('b'); n.textContent = secret ? 'Hidden trophy' : t.name;
      const d = document.createElement('span'); d.className = 'd'; d.textContent = secret ? 'Keep exploring. Not everything is in a gallery.' : t.desc;
      const meta = document.createElement('span'); meta.className = 'm';
      meta.textContent = TIERS[t.tier].name + (got ? ' · earned ' + new Date(got).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');
      body.append(n, d);
      // A counted one shows how far along it is.
      let goal = t.goal, have = 0;
      if (t.id === 'all') { goal = this.list.length - 1; have = tot.n - (this.earned.all ? 1 : 0); }
      else if (s && t.count) { try { have = t.count(s); if (t.total) goal = t.total(s); } catch { goal = 0; } }
      if (goal > 0 && !secret && (s || t.id === 'all')) {
        have = got ? goal : Math.min(have, goal);
        const bar = document.createElement('span'); bar.className = 'bar'; bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuemin', 0); bar.setAttribute('aria-valuemax', goal); bar.setAttribute('aria-valuenow', have);
        const fill = document.createElement('i'); fill.style.width = Math.round(100 * have / goal) + '%';
        bar.append(fill);
        const num = document.createElement('span'); num.className = 'num'; num.textContent = `${have.toLocaleString()} / ${goal.toLocaleString()}`;
        body.append(bar, num);
      }
      body.append(meta);
      li.append(ico, body);
      li.setAttribute('aria-label', `${secret ? 'Hidden trophy' : t.name}, ${TIERS[t.tier].name}, ${got ? 'earned' : 'not yet earned'}`);
      return li;
    }));
  }

  /** The screen lies over whatever menu opened it, and hands the focus back when it shuts. */
  open() {
    const el = document.getElementById('trophies');
    if (!el || this.isOpen) return;
    this._from = document.activeElement;
    this.isOpen = true;
    this.render();
    this._under = ['title', 'pause'].map(id => document.getElementById(id)).filter(x => x && !x.hidden);
    for (const x of this._under) x.inert = true;          // the menu underneath is out of reach while this is up
    el.hidden = false;
    document.getElementById('trGrid').scrollTop = 0;
    const b = el.querySelector('[data-first]'); if (b) b.focus({ preventScroll: true });
  }
  close() {
    const el = document.getElementById('trophies');
    if (!el || !this.isOpen) return;
    this.isOpen = false;
    el.hidden = true;
    for (const x of this._under || []) x.inert = false;
    if (this._from && this._from.focus && document.contains(this._from)) this._from.focus({ preventScroll: true });
  }
}
