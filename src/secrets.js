// Secrets. Everything in the building that is not a room or a picture: the card game, the stall,
// the monitors somebody left on, the red button, the easel, the pond. Nothing tells you where they
// are. Each one found is counted, and the count is on the screen: SECRETS 3 / 18.
//
// Anything can register a secret: G.secrets.add('id', 'What it is called'), and
// G.secrets.find('id') when the player comes across it. A secret added later raises the total.

const KEY = 'after-hours.secrets';

export class Secrets {
  constructor({ onFind } = {}) {
    this.list = new Map();                             // id -> name
    this.found = new Set();
    this.onFind = onFind || null;
    try { for (const id of JSON.parse(localStorage.getItem(KEY) || '[]')) this.found.add(id); } catch { /* no storage */ }
  }
  add(id, name) { if (!this.list.has(id)) this.list.set(id, name); return this; }
  get total() { return this.list.size; }
  get count() { let n = 0; for (const id of this.list.keys()) if (this.found.has(id)) n++; return n; }
  has(id) { return this.found.has(id); }
  /** Come across one. Says so the first time. */
  find(id) {
    if (!this.list.has(id) || this.found.has(id)) return false;
    this.found.add(id);
    try { localStorage.setItem(KEY, JSON.stringify([...this.found])); } catch { /* fine */ }
    if (this.onFind) this.onFind({ id, name: this.list.get(id), count: this.count, total: this.total });
    return true;
  }
  /** For a list: every secret, found ones named, the rest as question marks. */
  rows() { return [...this.list].map(([id, name]) => ({ id, name: this.found.has(id) ? name : '? ? ?', found: this.found.has(id) })); }
  reset() { this.found.clear(); try { localStorage.removeItem(KEY); } catch { /* fine */ } }
}
