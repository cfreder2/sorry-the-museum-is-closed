/*
 * Who plays, how they get in, how far round they get, what they stop to look at, and which of
 * the side games they find.
 *
 * Rows go to the VECTRENCH Supabase project, into its `museum_*` tables (see
 * supabase/001-telemetry.sql), the same place Vec Trench, AXI and MANTIS report to. Identity is
 * that project's anonymous sign-in: the first time a device plays it silently becomes an auth
 * user, and the refresh token in localStorage is the device from then on. No name, no email,
 * no address; nothing typed, because nothing is typed in this game.
 *
 * Besides the session and its events there is one count kept for everybody: how many times each
 * work has been looked at (supabase/003-views.sql; `view` and `topViews` below).
 *
 * Every call here fails soft and nothing in the game waits on it.
 *
 * Off when the player turns it off in Settings. Off by default on localhost, so building and
 * testing do not fill the tables; `?telemetry` turns it on there. A session no person is playing
 * is still reported, but flagged `synthetic`, and every summary leaves those out. Three tells: a
 * browser driven by automation (`navigator.webdriver`), a page where anything reached for the
 * test handle `window.__ah` (no player ever does; every test does), and a start from one of the
 * test switches (`?mode`, `?auto`, `?probe`, `?saved`, `?debug`).
 */

const NET_URL = 'https://csicwkbfgmjtuharranh.supabase.co';
const NET_KEY = 'sb_publishable_PSvK48E7hZgivrIXhAR0Og_QwN15V4D';   // public by design; row-level security guards the data
const IDENT_KEY = 'after-hours.identity.v1';
const HEARTBEAT_MS = 60000;

function store(k, v) {
  try {
    if (v === undefined) return localStorage.getItem(k);
    localStorage.setItem(k, v);
  } catch (e) { /* private mode: this session only */ }
  return null;
}
function uuid() {
  if (globalThis.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => ((Math.random() * 16) | 0).toString(16));
}
function where() {
  const h = (typeof location !== 'undefined' && location.hostname) || '';
  if (h.endsWith('github.io')) return 'pages';
  if (h.includes('itch')) return 'itch';
  if (h === 'localhost' || h === '127.0.0.1' || h === '') return 'local';
  return 'other';
}
function device() {
  const touchOnly = navigator.maxTouchPoints > 0 && typeof matchMedia === 'function' && !matchMedia('(any-pointer: fine)').matches;
  if (!touchOnly) return 'desktop';
  return Math.min(screen.width, screen.height) < 600 ? 'phone' : 'tablet';
}

export class Telemetry {
  constructor({ build = '' } = {}) {
    const q = new URLSearchParams(location.search);
    this.host = where();
    this.enabled = store('after-hours.offline') !== '1' && (this.host !== 'local' || q.has('telemetry')) && typeof fetch === 'function';
    this.allowed = true;             // the player's own switch, in Settings
    this.debugStart = ['mode', 'auto', 'probe', 'saved', 'debug', 'test'].some(k => q.has(k));
    this.handleTouched = false;      // set by main.js when anything reads window.__ah
    this.build = build;
    this.device = device();
    this.id = uuid();
    this.openedAt = Date.now();
    this.play = 0;                   // seconds driving, looking, or at the card table
    this.mode = 'explore'; this.toy = 'car'; this.resumed = false;
    this.gotIn = null; this.gotInSecs = null;
    this.seen = 0; this.seen0 = null;
    this.rooms = new Set();
    this.input = 'keys'; this.settings = {}; this.stats = {};
    this.started = null;             // promise: the session row exists
    this.token = null; this.tokenExp = 0; this._minting = null;
    if (!this.enabled) return;
    setInterval(() => { if (this.started) this.flush(); }, HEARTBEAT_MS);
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.started) this.flush(true); });
    window.addEventListener('pagehide', () => { if (this.started) this.flush(true); });
  }

  /** Why no person should be counted for this, or null. Asked at send time, because the test
   * handle can be reached for after the page has loaded. */
  get synth() {
    if (navigator.webdriver) return 'agent';
    if (this.handleTouched) return 'agent';
    if (this.debugStart) return 'debug';
    return null;
  }

  // ------------------------------------------------------------- the wire --
  async session() {
    if (this.token && Date.now() / 1000 < this.tokenExp - 60) return this.token;
    if (this._minting) return this._minting;
    this._minting = (async () => {
      let id = null;
      try { id = JSON.parse(store(IDENT_KEY) || 'null'); } catch (e) { /* start fresh */ }
      let r = null;
      if (id && id.refresh_token) {
        r = await this.call('/auth/v1/token?grant_type=refresh_token', { refresh_token: id.refresh_token }, false);
        if (r && r.status !== 200) r = null;       // revoked or pruned: be born again
      }
      if (!r) r = await this.call('/auth/v1/signup', {}, false);
      if (!r || r.status !== 200 || !r.data || !r.data.access_token) return null;
      this.token = r.data.access_token;
      this.tokenExp = r.data.expires_at || (Date.now() / 1000 + (r.data.expires_in || 3600));
      store(IDENT_KEY, JSON.stringify({ refresh_token: r.data.refresh_token, user_id: r.data.user && r.data.user.id }));
      return this.token;
    })();
    const t = await this._minting;
    this._minting = null;
    return t;
  }

  async call(path, body, auth = true, keepalive = false) {
    if (!this.enabled || !this.allowed) return null;
    try {
      const headers = { apikey: NET_KEY, 'Content-Type': 'application/json' };
      if (auth) {
        // On the way out there is no time to sign in: a token already held is used, and without one the row is not sent.
        const t = keepalive ? this.token : await this.session();
        if (!t) return null;
        headers.Authorization = `Bearer ${t}`;
      }
      const r = await fetch(NET_URL + path, { method: 'POST', headers, body: JSON.stringify(body), keepalive, referrerPolicy: 'no-referrer' });
      let data = null;
      try { data = await r.json(); } catch (e) { /* 204 */ }
      return { status: r.status, data };
    } catch (e) { return null; }
  }
  rpc(name, p, keepalive = false) { return this.call(`/rest/v1/rpc/${name}`, { p: { v: 1, ...p } }, true, keepalive); }

  // ------------------------------------------------------------ reporting --
  /** The session's totals so far. Sent when a game starts, each minute after, and as the page is hidden. */
  flush(keepalive = false) {
    return this.rpc('museum_record_session', {
      id: this.id, build: this.build, host: this.host, device: this.device, input: this.input, settings: this.settings,
      wall: Math.round((Date.now() - this.openedAt) / 1000), play: Math.round(this.play),
      mode: this.mode, toy: this.toy, resumed: this.resumed, gotIn: this.gotIn, gotInSecs: this.gotInSecs,
      seen: this.seen, seenNew: this.seen0 == null ? 0 : Math.max(0, this.seen - this.seen0), rooms: this.rooms.size,
      stats: this.stats, synth: this.synth,
    }, keepalive);
  }

  /** A game begins: from the title, a fresh one or a saved one carried on. */
  begin({ mode, toy, resumed, seen }) {
    this.mode = mode; this.toy = toy; this.resumed = this.resumed || !!resumed;
    if (this.seen0 == null) this.seen0 = seen;
    this.seen = seen;
    if (!this.enabled) return;
    if (!this.started) this.started = this.flush();
    this.event('start', mode, { toy, resumed: !!resumed });
  }

  /** Something that happened once. `ref` is what it happened to: a room, a work, a way in. */
  event(kind, ref, data = {}) {
    if (!this.enabled || !this.started) return;
    this.started.then(() => this.rpc('museum_record_event', { session: this.id, kind, ref: ref == null ? null : String(ref), secs: Math.round(this.play * 10) / 10, build: this.build, data, synth: this.synth }));
  }

  // ---------------------------------------------------------- view counts --
  // How many times everybody has looked at each work (supabase/003-views.sql). Told only for a
  // person playing, with statistics switched on: never from a test, never when the switch is off.
  /** A work looked at. Resolves to the work's new total, or null. */
  view(id, title, stunt = false) {
    if (!this.enabled || !this.allowed || this.synth) return null;
    return this.call('/rest/v1/rpc/museum_record_view', { artwork_id: id, title: String(title || '').slice(0, 200), stunt: !!stunt })
      .then(r => (r && r.status === 200 && typeof r.data === 'number' ? r.data : null));
  }
  /** The most-viewed works: [{ artwork_id, title, views, stunt_views }], or null. */
  topViews(n = 20) {
    return this.call('/rest/v1/rpc/museum_top_views', { n }).then(r => (r && r.status === 200 && Array.isArray(r.data) ? r.data : null));
  }

  /** In through the wall, the window or the roof. */
  inside(how) { if (this.gotIn) return; this.gotIn = how; this.gotInSecs = Math.round(this.play); this.event('in', how); if (this.started) this.flush(); }
  /** A room entered: reported the first time in a session. */
  room(id) { if (this.rooms.has(id)) return; this.rooms.add(id); this.event('room', id); }
}
