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
  /** Put one back as found, without a word: for a collection that a new game leaves finished (features.js, k.keeps). */
  keep(id) {
    if (!this.list.has(id) || this.found.has(id)) return false;
    this.found.add(id);
    try { localStorage.setItem(KEY, JSON.stringify([...this.found])); } catch { /* fine */ }
    return true;
  }
  /** For a list: every secret, found ones named, the rest as question marks. */
  rows() { return [...this.list].map(([id, name]) => ({ id, name: this.found.has(id) ? name : '? ? ?', found: this.found.has(id) })); }
  // The list, as a screen laid over whichever menu opened it: found ones by name, the rest as question marks.
  open() {
    if (!this.el) {
      const st = document.createElement('style');
      st.textContent = `#secrets { position: fixed; inset: 0; z-index: 40; display: flex; align-items: center; justify-content: center; background: rgba(4,5,9,.93); padding: max(12px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left)); box-sizing: border-box; font-family: var(--serif, Georgia, serif); color: var(--cream, #f1ead8); }
#secrets[hidden] { display: none; }
#secrets .box { width: min(760px, 100%); max-height: 100%; display: flex; flex-direction: column; gap: 10px; }
#secrets h2 { margin: 0; font-size: 22px; letter-spacing: .14em; text-transform: uppercase; color: var(--gilt, #e2cd94); }
#secrets .n { font: 600 13px var(--mono, ui-monospace, monospace); letter-spacing: .08em; color: var(--gilt, #e2cd94); }
#secrets ol { list-style: none; margin: 0; padding: 0; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 6px 14px; }
#secrets li { display: flex; gap: 10px; align-items: baseline; font-size: 15px; padding: 5px 0; border-bottom: 1px solid rgba(226,205,148,.16); }
#secrets li i { flex: none; width: 1.1em; font-style: normal; color: var(--gilt, #e2cd94); }
#secrets li.no { color: #7d786c; letter-spacing: .2em; }
#secrets li.no i { color: #5a564d; }
#secrets button { height: 44px; border-radius: 8px; border: 1px solid rgba(226,205,148,.6); background: rgba(8,9,14,.66); color: var(--gilt, #e2cd94); font: 700 12px var(--mono, ui-monospace, monospace); letter-spacing: .12em; }`;
      document.head.append(st);
      const el = this.el = document.createElement('section'); el.id = 'secrets'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Secrets');
      el.innerHTML = '<div class="box"><h2>Secrets</h2><div class="n"></div><ol></ol><button>Close</button></div>';
      document.body.append(el);
      el.querySelector('button').addEventListener('click', () => this.close());
      addEventListener('keydown', e => { if (!this.el.hidden && e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(); } }, true);
    }
    const ol = this.el.querySelector('ol'); ol.textContent = '';
    for (const r of this.rows().sort((a, b) => b.found - a.found)) { const li = document.createElement('li'); li.className = r.found ? '' : 'no'; const i = document.createElement('i'); i.textContent = r.found ? '\u2605' : '\u00b7'; li.append(i, r.name); ol.append(li); }
    this.el.querySelector('.n').textContent = `${this.count} OF ${this.total} FOUND`;
    this.back = document.activeElement; this.el.hidden = false; this.el.querySelector('button').focus({ preventScroll: true });
  }
  close() { if (!this.el || this.el.hidden) return; this.el.hidden = true; if (this.back && this.back.focus) this.back.focus({ preventScroll: true }); }
  reset() { this.found.clear(); try { localStorage.removeItem(KEY); } catch { /* fine */ } }
}
