// The loop, kept in sight while you play: one small line by the pause button, secrets found and art viewed
// ("✦ 3 / 119   ▢ 12 viewed"). It pulses when either goes up (once the card for a secret, src/trophies.js, has gone), and
// goes with the rest of the corner while you look at a work (.studying), in a race, and in a cutscene (.cine).
//
// And the map's faint green "?" (the next clue of the Green Cheese file, src/story.js): the first time one appears, and
// whenever it moves on, a green ring pulses round the radar for a few seconds; the very first time, a line says what it is.
//
//   const loop = new LoopHud(G, { secrets, score, say });   loop.update() from main.js's hud(), every frame of play

const TIPS = 'after-hours.tips';

export class LoopHud {
  constructor(G, { secrets, score, say }) {
    this.G = G; this.secrets = secrets; this.score = score; this.say = say;
    this.n = 0; this.sec = -1; this.art = -1; this.clueKey = null; this.clueUntil = 0;
    const st = document.createElement('style');
    st.textContent = `#loop { display: flex; gap: 14px; align-items: baseline; font: 12px/1 var(--mono); letter-spacing: .08em; color: #cfc8b6; text-shadow: 0 1px 3px #000; white-space: nowrap; background: rgba(8,9,14,.55); border: 1px solid rgba(226,205,148,.28); border-radius: 19px; padding: 7px 13px 6px; }
#loop span { display: inline-flex; align-items: baseline; gap: 5px; transform-origin: 0 60%; }
#loop b { font-size: 15px; font-weight: 600; color: var(--cream); }
#loop i { font-style: normal; color: var(--gilt); font-size: 13px; }
#loop i.fr { display: inline-block; width: 9px; height: 7px; border: 1.5px solid var(--gilt); border-radius: 1px; margin-right: 1px; }
#loop small { font-size: 11px; }
#loop span.pulse { animation: loopPulse .9s ease-out 2; }
#loop span.pulse b, #loop span.pulse i { color: #fff3c4; }
@keyframes loopPulse { 0% { transform: scale(1); } 30% { transform: scale(1.18); text-shadow: 0 0 14px rgba(255,226,140,.95), 0 1px 6px #000; } 100% { transform: scale(1); } }
.in-race #loop { display: none; }
#map.clue { animation: clueRing 1.5s ease-in-out 4; }
@keyframes clueRing { 0%, 100% { box-shadow: 0 2px 14px rgba(0,0,0,.6), 0 0 0 0 rgba(157,255,176,0); } 50% { box-shadow: 0 2px 14px rgba(0,0,0,.6), 0 0 0 5px rgba(157,255,176,.75), 0 0 26px 8px rgba(157,255,176,.45); } }
.reduce #loop span.pulse { animation: none; }
.reduce #map.clue { animation: none; box-shadow: 0 2px 14px rgba(0,0,0,.6), 0 0 0 4px rgba(157,255,176,.7); }
.bigtext #loop { font-size: 15px; background: rgba(0,0,0,.82); padding: 6px 10px; border-radius: 4px; color: #fff; } .bigtext #loop b { font-size: 18px; }
@media (max-height: 460px) { #loop { font-size: 10.5px; gap: 10px; padding: 6px 10px 5px; } #loop b { font-size: 13px; } }`;
    document.head.append(st);
    const el = this.el = document.createElement('div');
    el.id = 'loop'; el.setAttribute('role', 'status');
    el.innerHTML = '<span class="sec" title="Secrets found"><i aria-hidden="true">✦</i><b>0</b><small>/ 0</small></span><span class="art" title="Works you have looked at closely"><i class="fr" aria-hidden="true"></i><b>0</b><small>viewed</small></span>';
    const corner = document.getElementById('topleft');
    if (corner) corner.append(el); else document.getElementById('hud').append(el);
    this.secEl = el.firstElementChild; this.artEl = el.lastElementChild;
  }

  _pulse(span) { span.classList.remove('pulse'); void span.offsetWidth; span.classList.add('pulse'); clearTimeout(span._t); span._t = setTimeout(() => span.classList.remove('pulse'), 1900); }
  _tip(key) { let t = {}; try { t = JSON.parse(localStorage.getItem(TIPS) || '{}') || {}; } catch { /* none kept */ } if (t[key]) return false; t[key] = 1; try { localStorage.setItem(TIPS, JSON.stringify(t)); } catch { /* fine */ } return true; }

  update() {
    const G = this.G;
    if (++this.n % 6) return;
    document.body.classList.toggle('in-race', !!G.racing);
    const sec = this.secrets.count, total = this.secrets.total, art = this.score.looked;
    if (sec !== this.sec) {
      const up = this.sec >= 0 && sec > this.sec; this.sec = sec;
      this.secEl.children[1].textContent = sec; this.secEl.children[2].textContent = '/ ' + total;
      this.secEl.setAttribute('aria-label', `${sec} of ${total} secrets found`);
      if (up) this.secDue = true;
    } else if (this.secEl.children[2].textContent !== '/ ' + total) this.secEl.children[2].textContent = '/ ' + total;
    if (art !== this.art) {
      const up = this.art >= 0 && art > this.art; this.art = art;
      this.artEl.children[1].textContent = art.toLocaleString(); this.artEl.setAttribute('aria-label', `${art} works viewed`);
      if (up) this.artDue = true;
    }
    // The card that says what was found lies over this corner while it is up: the count pulses as it slides away, so the eye goes from one to the other.
    const card = document.getElementById('trophyToast'), covered = card && !card.hidden;
    if (!covered) { if (this.secDue) { this.secDue = false; this._pulse(this.secEl); } if (this.artDue) { this.artDue = false; this._pulse(this.artEl); } }
    // The next clue's "?" on the map: noticed when it appears and whenever it moves on.
    const marks = (G.mapMarks || []).filter(m => m.story), key = marks.map(m => `${Math.round(m.x)},${Math.round(m.z)}`).join('|');
    if (key !== this.clueKey) {
      const fresh = !!key && this.clueKey !== null; this.clueKey = key;
      if (key && (fresh || this._seenClue !== true)) {
        this._seenClue = true;
        const map = document.getElementById('map'); map.classList.remove('clue'); void map.offsetWidth; map.classList.add('clue'); this.clueUntil = G.t + 6.5;
        if (this._tip('clue')) this.say('A green ? on the map: where to look next.', 1.2, 6);
      }
    }
    if (this.clueUntil && G.t > this.clueUntil) { this.clueUntil = 0; document.getElementById('map').classList.remove('clue'); }
  }
}
