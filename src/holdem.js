// Texas hold'em, no limit. The rules and the players' brains; nothing here draws anything.
//
// A card is a number 0..51: rank = n >> 2 (0 is a two, 12 an ace), suit = n & 3.

export const RANKS = '23456789TJQKA', SUITS = '♣♦♥♠';
export const cardName = c => (RANKS[c >> 2] === 'T' ? '10' : RANKS[c >> 2]) + SUITS[c & 3];

// The best five of up to seven cards, as one number: a bigger number is a better hand.
// The category is in the top digit (8 straight flush ... 0 high card), then the cards that decide ties.
export function score(cards) {
  const rc = new Array(13).fill(0), sc = [0, 0, 0, 0], bySuit = [0, 0, 0, 0];
  for (const c of cards) { rc[c >> 2]++; sc[c & 3]++; bySuit[c & 3] |= 1 << (c >> 2); }
  let all = 0; for (let r = 0; r < 13; r++) if (rc[r]) all |= 1 << r;
  const straight = m => { for (let h = 12; h >= 4; h--) if (((m >> (h - 4)) & 31) === 31) return h; return (m & 0x100f) === 0x100f ? 3 : -1; };   // the wheel: A-2-3-4-5, five high
  const pack = (cat, ...k) => { let v = cat; for (let i = 0; i < 5; i++) v = v * 15 + (k[i] ?? 0) + 1; return v; };
  const tops = (m, n, skip = []) => { const o = []; for (let r = 12; r >= 0 && o.length < n; r--) if (((m >> r) & 1) && !skip.includes(r)) o.push(r); return o; };
  const fs = sc.findIndex(n => n >= 5);
  if (fs >= 0) { const h = straight(bySuit[fs]); if (h >= 0) return pack(8, h); }
  const groups = n => { const o = []; for (let r = 12; r >= 0; r--) if (rc[r] === n) o.push(r); return o; };
  const four = groups(4), three = groups(3), two = groups(2);
  if (four.length) return pack(7, four[0], ...tops(all, 1, [four[0]]));
  if (three.length && (three.length > 1 || two.length)) return pack(6, three[0], Math.max(three[1] ?? -1, two[0] ?? -1));
  if (fs >= 0) return pack(5, ...tops(bySuit[fs], 5));
  const st = straight(all);
  if (st >= 0) return pack(4, st);
  if (three.length) return pack(3, three[0], ...tops(all, 2, [three[0]]));
  if (two.length > 1) return pack(2, two[0], two[1], ...tops(all, 1, [two[0], two[1]]));
  if (two.length) return pack(1, two[0], ...tops(all, 3, [two[0]]));
  return pack(0, ...tops(all, 5));
}
const NAMES = ['high card', 'a pair', 'two pair', 'three of a kind', 'a straight', 'a flush', 'a full house', 'four of a kind', 'a straight flush'];
export const handName = s => NAMES[Math.floor(s / 15 ** 5)];

function shuffled(rand) { const d = Array.from({ length: 52 }, (_, i) => i); for (let i = 51; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } return d; }

// How often does this hand win against `opp` unseen hands, with the board as it stands? Dealt out many times.
export function equity(hole, board, opp, iters = 140, rand = Math.random) {
  const used = new Set([...hole, ...board]), rest = []; for (let c = 0; c < 52; c++) if (!used.has(c)) rest.push(c);
  let win = 0;
  for (let t = 0; t < iters; t++) {
    for (let i = 0, n = 5 - board.length + opp * 2; i < n; i++) { const j = i + Math.floor(rand() * (rest.length - i)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
    const need = 5 - board.length, b = board.concat(rest.slice(0, need)), mine = score(hole.concat(b));
    let best = 0, ties = 0;
    for (let o = 0; o < opp; o++) { const s = score([rest[need + o * 2], rest[need + o * 2 + 1], ...b]); if (s > best) best = s; if (s === mine) ties++; }
    if (mine > best) win += 1; else if (mine === best) win += 1 / (ties + 1);
  }
  return win / iters;
}

export class Holdem {
  // players: [{ name, stack, bot, tight, bold }]  tight: how good a hand it wants; bold: how readily it bets
  constructor(players, bb = 20, rand = Math.random) {
    this.p = players.map((q, i) => ({ tight: 0.5, bold: 0.5, ...q, seat: i, cards: [], bet: 0, total: 0, folded: true, allIn: false, acted: false, said: '' }));
    this.bb = bb; this.rand = rand; this.button = this.p.length - 1; this.phase = 'idle'; this.board = []; this.log = []; this.hand = 0; this.to = -1; this.cur = 0; this.minRaise = bb; this.result = null;
  }
  get pot() { return this.p.reduce((a, q) => a + q.total, 0); }
  say(t) { this.log.push(t); if (this.log.length > 40) this.log.shift(); }
  // "Dozer calls $20." but "You call $20."
  tell(q, did) {
    if (q.name !== 'You') return q.name + ' ' + did;
    if (did.startsWith('all in')) return 'You are ' + did;
    const sp = did.indexOf(' '), verb = sp < 0 ? did : did.slice(0, sp);
    return 'You ' + (verb.endsWith('s') ? verb.slice(0, -1) : verb) + (sp < 0 ? '' : did.slice(sp));
  }
  next(i, ok) { for (let k = 1; k <= this.p.length; k++) { const j = (i + k) % this.p.length; if (ok(this.p[j])) return j; } return -1; }
  inHand() { return this.p.filter(q => !q.folded); }

  // Deal a new hand. False if there is nobody left to play against.
  deal() {
    const withChips = this.p.filter(q => q.stack > 0);
    if (withChips.length < 2) { this.phase = 'over'; return false; }
    this.hand++; this.board = []; this.result = null;
    for (const q of this.p) { q.cards = []; q.bet = 0; q.total = 0; q.folded = q.stack <= 0; q.allIn = false; q.acted = false; q.said = q.stack <= 0 ? 'out' : ''; q.shown = false; q.won = 0; }
    const live = q => q.stack > 0 || q.total > 0;
    this.button = this.next(this.button, q => !q.folded);
    this.deck = shuffled(this.rand);
    for (let r = 0; r < 2; r++) for (let k = 1; k <= this.p.length; k++) { const q = this.p[(this.button + k) % this.p.length]; if (!q.folded) q.cards.push(this.deck.pop()); }
    const heads = withChips.length === 2, sb = heads ? this.button : this.next(this.button, q => !q.folded), bbi = this.next(sb, q => !q.folded);
    this.post(this.p[sb], this.bb / 2); this.p[sb].said = 'small blind'; this.post(this.p[bbi], this.bb); this.p[bbi].said = 'big blind';
    this.cur = this.bb; this.minRaise = this.bb; this.phase = 'preflop';
    this.to = this.next(bbi, q => !q.folded && !q.allIn);
    this.say('Hand ' + this.hand + '. ' + this.tell(this.p[this.button], 'deals') + '.');
    void live;
    if (this.to < 0 || this.inHand().filter(q => !q.allIn).length < 2 && this.p.every(q => q.folded || q.allIn || q.bet >= this.cur)) this.runOut();
    return true;
  }
  post(q, amt) { const a = Math.min(amt, q.stack); q.stack -= a; q.bet += a; q.total += a; if (q.stack === 0) q.allIn = true; return a; }

  // What the player whose turn it is may do.
  legal() {
    const q = this.p[this.to];
    if (!q) return null;
    const call = Math.min(q.stack, this.cur - q.bet), max = q.bet + q.stack, others = this.p.some(o => o !== q && !o.folded && !o.allIn);
    return { call, canCheck: call === 0, canRaise: q.stack > call && others, min: Math.min(max, this.cur + this.minRaise), max };
  }
  // type: 'fold' | 'call' (which is a check when there is nothing to call) | 'raise' with `to`, the total to make it
  act(type, to) {
    const q = this.p[this.to], L = this.legal();
    if (!q || !L) return;
    if (type === 'raise' && !L.canRaise) type = 'call';
    if (type === 'fold' && L.canCheck) type = 'call';
    if (type === 'fold') { q.folded = true; q.said = 'folds'; this.say(this.tell(q, 'folds') + '.'); }
    else if (type === 'call') { const a = this.post(q, L.call); q.said = a === 0 ? 'checks' : q.allIn ? `all in, $${q.bet}` : `calls $${a}`; this.say(this.tell(q, q.said) + '.'); }
    else {
      const t = Math.max(L.min, Math.min(L.max, Math.round(to))), by = t - this.cur, opened = this.cur === 0;
      this.post(q, t - q.bet);
      if (by >= this.minRaise) { this.minRaise = by; for (const o of this.p) if (o !== q) o.acted = false; }       // a full raise reopens the betting
      else for (const o of this.p) if (o !== q && o.bet < t) o.acted = false;
      this.cur = Math.max(this.cur, t);
      q.said = q.allIn ? `all in, $${t}` : opened ? `bets $${t}` : `raises to $${t}`; this.say(this.tell(q, q.said) + '.');
    }
    q.acted = true;
    this.advance();
  }
  advance() {
    const left = this.inHand();
    if (left.length === 1) return this.finish([{ amount: this.pot, among: left }], false);
    const nxt = this.next(this.to, q => !q.folded && !q.allIn && (!q.acted || q.bet < this.cur));
    if (nxt >= 0) { this.to = nxt; return; }
    // The round of betting is done.
    if (this.phase === 'river' || left.filter(q => !q.allIn).length < 2) return this.runOut();
    this.street();
    this.to = this.next(this.button, q => !q.folded && !q.allIn);
  }
  street() {
    for (const q of this.p) { q.bet = 0; q.acted = false; if (!q.folded && !q.allIn) q.said = ''; }
    this.cur = 0; this.minRaise = this.bb;
    if (this.phase === 'preflop') { this.board.push(this.deck.pop(), this.deck.pop(), this.deck.pop()); this.phase = 'flop'; this.say(`The flop: ${this.board.map(cardName).join(' ')}`); }
    else if (this.phase === 'flop') { this.board.push(this.deck.pop()); this.phase = 'turn'; this.say(`The turn: ${cardName(this.board[3])}`); }
    else { this.board.push(this.deck.pop()); this.phase = 'river'; this.say(`The river: ${cardName(this.board[4])}`); }
  }
  // Nobody left to bet: turn the rest of the cards and see who has what.
  runOut() {
    while (this.board.length < 5) this.street();
    // Side pots: each level of money can only be won by those who put that much in.
    const levels = [...new Set(this.inHand().map(q => q.total))].sort((a, b) => a - b), pots = [];
    let prev = 0;
    for (const lv of levels) {
      const amount = this.p.reduce((a, q) => a + Math.max(0, Math.min(q.total, lv) - prev), 0);
      if (amount > 0) pots.push({ amount, among: this.inHand().filter(q => q.total >= lv) });
      prev = lv;
    }
    const over = this.p.reduce((a, q) => a + Math.max(0, q.total - prev), 0);          // money a folded player put in above every live stack
    if (over > 0 && pots.length) pots[pots.length - 1].amount += over;
    this.finish(pots, true);
  }
  finish(pots, show) {
    this.to = -1;
    const lines = [];
    for (const q of this.inHand()) { q.sc = show ? score(q.cards.concat(this.board)) : 0; q.shown = show; }
    for (const pot of pots) {
      const best = Math.max(...pot.among.map(q => q.sc)), win = pot.among.filter(q => q.sc === best), each = Math.floor(pot.amount / win.length);
      win.forEach((q, i) => { const a = each + (i === 0 ? pot.amount - each * win.length : 0); q.stack += a; q.won += a; });
    }
    for (const q of this.p) if (q.won > 0) { q.said = `wins $${q.won}`; lines.push(this.tell(q, 'wins') + ' $' + q.won + (show ? ' with ' + handName(q.sc) : '') + '.'); }
    for (const q of this.p) { q.total = 0; q.bet = 0; }
    for (const l of lines) this.say(l);
    this.result = { lines, show };
    this.phase = 'showdown';
  }

  // A machine's turn: what does it do? Returns ['fold'|'call'|'raise', to].
  think() {
    const q = this.p[this.to], L = this.legal(), opp = this.inHand().length - 1, pot = this.pot;
    const eq = equity(q.cards, this.board, Math.max(1, opp), 120, this.rand), fair = 1 / (opp + 1), r = this.rand();
    const strong = eq / fair;                              // 1 is an average hand for this many players
    const size = f => Math.max(L.min, Math.min(L.max, Math.round((this.cur + pot * f) / 10) * 10));
    const pre = this.phase === 'preflop';
    if (L.canCheck) {
      if (L.canRaise && (strong > 1.55 - q.bold * 0.35 || r < 0.05 + q.bold * 0.07)) return ['raise', pre ? Math.max(L.min, this.bb * (2 + Math.round(r * 2))) : size(0.45 + q.bold * 0.4)];
      return ['call'];
    }
    const odds = L.call / (pot + L.call), price = L.call / Math.max(1, q.stack + q.bet);
    // A big bet needs a real hand; a cheap one can be seen with less.
    const need = odds * (0.85 + q.tight * 0.5) + price * 0.25;
    if (eq < need && !(r < 0.04 && price < 0.08)) return ['fold'];
    if (L.canRaise && (strong > 2.0 - q.bold * 0.4 && eq > 0.5 || eq > 0.8) && r < 0.35 + q.bold * 0.5) return ['raise', eq > 0.85 && r < 0.3 ? L.max : size(0.6 + q.bold * 0.4)];
    return ['call'];
  }
}
