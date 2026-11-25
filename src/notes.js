// The guard's sticky notes. The night guard leaves yellow notes low on the walls, at a toy's eye height:
// grumbles, jokes, and a lot of hints about the odd things that go on in the galleries next door. Pull up
// beside one and it is read out to you; read ten and you have found the guard's notes.

import * as THREE from 'three';
import { feature } from './features.js';
import { wallSpots, sameFloor, rng, galleryNo, claimed, claim, placingNow } from './placing.js';

const FONT = '"Marker Felt", "Bradley Hand", "Segoe Print", "Chalkboard SE", "Comic Sans MS", "Comic Neue", cursive';
const NEED = 10;
const PUBLIC = r => r.kind !== 'backofhouse' && r.kind !== 'service' && r.kind !== 'kitchen' && !/^B[0-9L]/.test(r.id);

// Each hint is left next to the room it is about: { g: gallery number } | { room: id } | { re: name } | { out: [x, z] outdoors }.
const HINTS = [
  { g: 201, text: 'Gallery 201: roof leak?? floor wet by the Paris street AGAIN. don’t stare at it too long. it rains.' },
  { g: 240, text: 'a monkey has come out of the painting in 240 AGAIN. it’s hiding under the bench. we can’t get it. the robots aren’t fast enough. get the groundskeeper to see if he can get it out.' },      // (src/l2-grandejatte.js: it is there, and it runs)
  { g: 241, text: 'Van Gogh’s bedroom, 241: that door in the wall is NOT a door.\n(it is.)' },
  { g: 243, text: '243: the haystacks change with the light. so does the lily pond?? ask me in spring.' },
  { g: 242, text: '242: somebody hums the can-can in there after midnight. it is not me.' },
  { g: 231, text: 'clocks in 231: every one of them wrong. set them right and they all strike. probably.' },
  { g: 220, text: 'lion count so far: 7. there are more. start with the Delacroix, 220.' },
  { g: 239, text: 'the armour in 239 turned its head at me. I am not making this up. it wants a joust.' },
  { g: 237, text: '237: keep clear of St George’s dragon after dark. it is not as dead as it looks.' },
  { g: 141, text: 'Shiva, 141: do NOT touch the ring of fire. drive round it. (how many times?)' },
  { g: 107, text: 'Utamaro’s hours, 107: what time is it in there? the pictures know.' },
  { g: 103, text: 'one of the Noh masks from 103 has wandered off. last seen in an office??' },
  { g: 154, text: 'mosaic tiles loose again in 154. push them back where they go. gently.' },
  { g: 161, text: 'why does 161 smell of herring. it is a painting.' },
  { re: /Thorne/i, g: 11, text: 'Thorne Rooms: there is a small door in the glass. TINY visitors only. (you count)' },
  { out: [316, 226], text: 'the hill by the band shell = best sledding in Chicago. don’t tell the gardeners.' },
  { out: [550, 110], text: 'ice-fishing hole on the harbour. bring a rod. a toy one is fine.' },
  { out: [380, 110], text: 'snowball targets up on Butler Field. three hits wins. I’ve never got three.' },
  { out: [195, 109], text: 'somebody skates on the rink at night. no skates. who??' },
  { re: /Bridgeway|bridge/i, alt: 'MW3-terrace', text: 'the Bridgeway: 38 seconds from the top to the bottom. beat that.' },
  { room: 'MW-lift', text: 'the glass lift still works after hours. ride it up and look.' },
  { room: 'MW3-terrace', text: 'drones through the sunshade blades on the roof: NO.\n(try it)' },
  { room: 'MW1-ed00', text: 'restoration studio, Ryan Learning Center: there is a frame in there waiting for its picture.' },
];
const JOKES = [
  'it is 3am. why are the lights on?',
  'please do not lick the sculpture. (this means you, Dave)',
  'the coffee machine owes me 75 cents.',
  'FOUND: one (1) toy car. it is fast. it is not mine.',
  'WET FLOOR\n(it is not)',
  'counted the stairs again. 112. yesterday 113.',
  'mouse seen by the skirting. AGAIN. I’m not chasing it.',
];

// ------------------------------------------------------------------ the paper --
// The handwritten note itself, for the card on screen: yellow paper, the guard's scrawl.
function paper(text, size = 360) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  g.fillStyle = '#f7e36a'; g.fillRect(0, 0, size, size);
  g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(0, 0, size, size * 0.12);
  g.fillStyle = '#23304f'; g.textBaseline = 'top';
  let fs = 34; const pad = 28, words = text.split(/(\s+)/);
  for (; fs > 16; fs -= 2) {
    g.font = `${fs}px ${FONT}`; const lines = []; let line = '';
    for (const w of words) { if (w.includes('\n')) { lines.push(line); line = ''; continue; } const t = line + w; if (g.measureText(t).width > size - pad * 2 && line.trim()) { lines.push(line); line = w.trimStart(); } else line = t; }
    lines.push(line);
    if (lines.length * fs * 1.25 < size - pad * 2 - 20) { lines.forEach((l, i) => g.fillText(l.trim(), pad, pad + 14 + i * fs * 1.25)); break; }
  }
  g.font = `italic 18px ${FONT}`; g.textAlign = 'right'; g.fillText('— G.', size - pad, size - pad - 14);
  return c;
}
// The note on the wall: four scribbles to choose from, all on one texture, so every note is one draw call together.
function atlas() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  for (let i = 0; i < 4; i++) {
    const x0 = i * 64; g.fillStyle = '#f2dc5a'; g.fillRect(x0, 0, 64, 64); g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(x0, 0, 64, 8);
    g.strokeStyle = '#2a3658'; g.lineWidth = 2.2; g.lineCap = 'round';
    const r = rng(7 + i);
    for (let l = 0; l < 4 + (i & 1); l++) { const y = 15 + l * 10; g.beginPath(); g.moveTo(x0 + 8, y); for (let x = 8; x < 50 - r() * 18; x += 4) g.lineTo(x0 + x, y + Math.sin(x * 0.9 + l) * 1.6 + (r() - 0.5)); g.stroke(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

feature({
  id: 'notes',
  secrets: [['notes', 'The guard’s notes']],
  init(k) { this.k = k; this.list = []; },

  place() {
    const k = this.k, P = k.plan, r = rng(4242), taken = claimed(k.G), used = new Set();
    const same = (a, b) => Math.abs(a - b) < 1.2;
    const ok = q => q && PUBLIC(q) && !q.secret && !q.passage && q.kind !== 'stair' && q.kind !== 'lift' && q.kind !== 'backofhouse' && (q.x1 - q.x0) > 2.2 && (q.z1 - q.z0) > 2.2;
    const spots = new Map(), spotsIn = q => { if (!spots.has(q)) spots.set(q, wallSpots(P, k.museum, q, { step: 0.4, clear: 0.55, depth: 0.25, height: 0.62, width: 0.12 })); return spots.get(q); };      // (asked of a room again and again)
    const put = (s, text, about) => { const n = { id: 'note' + this.list.length, text, about, x: s.x, y: s.room.y + 0.36, z: s.z, nx: s.nx, nz: s.nz, room: s.room.id, tilt: (r() - 0.5) * 0.22, v: this.list.length % 4 }; this.list.push(n); used.add(s.room.id); claim(n); return n; };
    // beside the door into room T, in the room next to it (or just inside T if there is nowhere next door)
    const besideDoor = T => {
      const opts = [];
      for (const d of P.doorsOf(T.id)) {
        if (!same(d.y, T.y)) continue;
        const N = P.byId[d.a === T.id ? d.b : d.a], cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2;
        for (const room of [N, T]) {
          if (!ok(room) || used.has(room.id) || !same(room.y, T.y)) continue;
          for (const s of spotsIn(room)) { const dd = Math.hypot(s.x - cx, s.z - cz); if (dd < 2.2) opts.push({ s, score: dd + (room === T ? 3 : 0) + (room.kind === 'gallery' ? 0 : 0.5) }); }
        }
      }
      opts.sort((a, b) => a.score - b.score); return opts[0] && opts[0].s;
    };
    for (const h of HINTS) {
      let T = null;
      if (h.room) T = P.byId[h.room];
      if (!T && h.re) T = P.rooms.find(q => h.re.test(q.gallery || '')) || (h.alt && P.byId[h.alt]);
      if (!T && h.g) T = P.rooms.find(q => galleryNo(q) === h.g && !q.secret);
      let rooms = T ? [T] : [];
      if (!T && h.out) {
        // the ways out nearest the place, and the public rooms they open from, nearest first
        const opts = [];
        for (const d of P.doors) { if (!d.out) continue; const room = P.byId[d.a] || P.byId[d.b]; if (!ok(room) || !PUBLIC(room)) continue; opts.push({ room, dd: Math.hypot((d.x0 + d.x1) / 2 - h.out[0], (d.z0 + d.z1) / 2 - h.out[1]) }); }
        rooms = opts.sort((a, b) => a.dd - b.dd).map(o => o.room).filter((q, i, a) => a.indexOf(q) === i).slice(0, 6);
      }
      for (const T of rooms) {
        const s = besideDoor(T) || (!used.has(T.id) && spotsIn(T)[0]);
        if (s) { put(s, h.text, T.id); break; }
      }
    }
    // the jokes go where there is least else to find
    const cands = [];
    for (const q of P.rooms) { if (!ok(q) || used.has(q.id)) continue; const s = spotsIn(q); if (s.length) cands.push(s[Math.floor(r() * s.length)]); }
    for (const text of JOKES) {
      let best = null, bd = -1;
      for (const c of cands) { if (used.has(c.room.id)) continue; const p = { x: c.x, y: c.room.y, z: c.z }; let d = 200; for (const t of taken) d = Math.min(d, sameFloor(p, t)); for (const t of this.list) d = Math.min(d, sameFloor(p, t)); if (d > bd) { bd = d; best = c; } }
      if (best) put(best, text, null);
    }
    this.tally = k.tally('notes', NEED);
    this._build(); this.placed = true;
  },

  _build() {
    const k = this.k, W = 0.11, pos = [], uv = [], nor = [], idx = [];
    for (const n of this.list) {
      const ux = n.nz, uz = -n.nx, off = 0.012, c = Math.cos(n.tilt), s = Math.sin(n.tilt), b = pos.length / 3, u0 = n.v / 4;
      for (const [a, e, tu, tv] of [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]]) {
        const lx = (a * c - e * s) * W / 2, ly = (a * s + e * c) * W / 2;
        pos.push(n.x + n.nx * off + ux * lx, n.y + ly, n.z + n.nz * off + uz * lx); uv.push(u0 + tu * 0.25, tv); nor.push(n.nx, 0, n.nz);
      }
      // wound to face out from the wall
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setIndex(idx);
    const tex = atlas();
    this.mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25 }));
    this.mesh.name = 'guard’s notes'; k.group.add(this.mesh);
    // the card on screen
    const el = this.card = document.createElement('div');
    el.id = 'guardNote';
    el.style.cssText = 'position:fixed;left:50%;top:42%;transform:translate(-50%,-50%) rotate(-2deg);width:min(62vmin,300px);aspect-ratio:1;box-shadow:0 10px 30px rgba(0,0,0,.45);pointer-events:none;opacity:0;transition:opacity .25s;z-index:30';
    document.body.appendChild(el);
  },
  _show(n) {
    if (this.showing === n) return;
    this.showing = n; this.card.innerHTML = '';
    if (n) { const c = paper(n.text); c.style.cssText = 'width:100%;height:100%;display:block'; this.card.appendChild(c); }
    this.card.style.opacity = n ? '1' : '0';
  },

  active(k) { return !k.G.racing; },
  update(dt, k) {
    if (!this.placed) this.place();
    const p = k.pos, v = k.v, speed = v && v.vel ? Math.hypot(v.vel.x, v.vel.z) : 0;
    let at = null;
    if (k.G.state === 'play') for (const n of this.list) {
      if (Math.abs(p.y - n.y) > 0.9 || Math.abs(p.x - n.x) > 1.1 || Math.abs(p.z - n.z) > 1.1) continue;
      const ahead = (p.x - n.x) * n.nx + (p.z - n.z) * n.nz;              // in front of it, not through the wall
      if (ahead > 0 && Math.hypot(p.x - n.x, p.z - n.z) < 1.0 && speed < 2.5) { at = n; break; }
    }
    this._show(at);
    if (at) {
      const now = performance.now(); if (this.readingId !== at.id) { this.readingId = at.id; this.readSince = now; }
      if (now - this.readSince >= 800 && this.tally.add(at.id)) {
        k.synth.note(700, 0.12, { type: 'triangle', vol: 0.03 });
        if (this.tally.count === NEED) { k.say(`That is ${NEED} of the guard’s notes read.`, 4); k.find('notes'); }
        else if (this.tally.count < NEED) k.once('note-first', `One of the night guard’s notes. There are ${this.list.length} of them about the building.`, 4);
      }
    } else this.readingId = null;
  },
  spots(k) {
    if (!this.placed && !placingNow()) { this.k = this.k || k; this.place(); }
    return (this.list || []).map(n => ({ kind: 'todo', id: n.id, name: 'Guard’s note: ' + n.text.slice(0, 40), x: n.x, y: n.y, z: n.z }));
  },
  reset() { if (this.card) this._show(null); },
});
