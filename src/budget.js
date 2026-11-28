// The phone budget. iOS gives a tab a few hundred megabytes of canvas and kills the page outright when the game asks
// for more (it reloads once, then gives up: "Can't open this page"). Every surface here is painted on a canvas at start-up,
// so on a phone, or any device short of memory, a finished canvas that is never drawn on again is handed over at half
// its size (at most 512 px; nothing under 256 px is touched) and the full-size one is let go.
//
//   shrink(canvas)   the canvas to make a texture from: the same one, or a smaller copy (the original is emptied).
//                    Only for canvases nobody draws on again (painted once, at start-up). Such a canvas is also let go
//                    once it is on the graphics card (below).
//   once(canvas)     the same promise, for a canvas that is not to be made smaller (or a data texture's image: { data,
//                    width, height }, made once and only for the graphics card).
//   onCard(thing)    a geometry or a texture whose only full copy is on the graphics card: not to be let go from there.

import * as THREE from 'three';

export const LOWMEM = (() => {
  try {
    const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    const mem = typeof navigator !== 'undefined' && navigator.deviceMemory;
    // (A small screen with a mouse or a trackpad for its pointer is a computer with its display scaled up: a handheld PC
    // at 200% reports 960 x 540. Only a small screen that is not one of those is taken for a phone.)
    const small = typeof screen !== 'undefined' && Math.min(screen.width, screen.height) < 600 && !(typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches);
    return !!(coarse || small || (mem && mem <= 4) || /[?&]lowmem\b/.test(location.search));
  } catch { return false; }
})();

const ONCE = new WeakSet();              // canvases nobody draws on again
export function once(c) { if (c) ONCE.add(c); return c; }

export function shrink(c, floor = 256, cap = 512) {
  if (!LOWMEM || !c || !c.width || !c.height || typeof c.getContext !== 'function') return once(c);
  const m = Math.max(c.width, c.height), target = Math.min(cap, Math.max(floor, m / 2));
  if (target >= m) return once(c);
  const k = target / m, w = Math.max(1, Math.round(c.width * k)), h = Math.max(1, Math.round(c.height * k));
  const o = document.createElement('canvas'); o.width = w; o.height = h;
  const g = o.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, w, h);
  c.width = c.height = 0;                // its memory, given back
  return once(o);
}

// ---- one copy, on the graphics card ----------------------------------------------------------------------------------
// Everything fixed in the world keeps a copy of its vertices in script memory after they have gone to the graphics card,
// where they are drawn from, and every canvas painted at start-up keeps its pixels after it has gone up as a texture. On a
// phone that is the world twice over (some 200 MB of vertices, as much again of canvas). So on a phone, a few seconds
// after a thing has been sent up and not changed since:
//   * (only with ?onecopy, to be tried on a real phone first: reading back is cheap in a desktop browser, but on iOS each
//     read is a full wait on the graphics card. Without the word nothing of this part is installed at all.)
//     a fixed thing's vertices are let go here. If anything asks for them again (a test against them, a copy, a write),
//     they are read back from the graphics card at that moment and kept from then on: nothing that reads them can tell.
//     The streamer (src/stream.js) does not let such a thing go from the card, since there would be nothing to send
//     up again: coming back costs nothing. (It never did let go of what museum.js and lights.js empty themselves.)
//   * a canvas painted once (shrink, once) is emptied, and its texture keeps a small copy (a quarter of the size each
//     way), which is all that would be sent up if three.js ever had to send it again. The streamer keeps such a texture
//     on the card for the same reason.
// What changes (a vertex written again, a canvas drawn on again) is never let go. A thing let go is never let go a second
// time once it has been read back. Nothing of this happens on a computer.
// (If the graphics card is lost altogether, and given back, what is held only there is gone: on a phone the page is
// loaded again, from what was saved: main.js. It always was lost there: museum.js and lights.js empty their vertices.)

const SETTLE = 4000;                     // ms a thing must have stood unchanged on the card before its copy here goes
const BUDGET = 3;                        // ms of letting go a time, at most (a little over, for the canvas it is on)
export const ONECOPY = LOWMEM && /[?&]onecopy\b/.test(typeof location !== 'undefined' ? location.search : '');
let GL = null, R = null, fresh = null;
const GONE = new WeakSet();              // buffers deleted
const WAIT = [];                         // vertex arrays sent up, waiting to be let go: [attribute, when]
const PICS = new Map();                  // painted-once canvases in use as textures: canvas -> { tex: Set, at }
let freedV = 0, freedC = 0, backs = 0;

const isCard = a => !!(a && a._card);
export function onCard(x) {
  if (!x) return false;
  if (x.isTexture) return !!(x.source && x.source._card);
  if (x.isBufferGeometry) { if (isCard(x.index)) return true; for (const k in x.attributes) if (isCard(x.attributes[k])) return true; }
  return false;
}

// The vertices back from the graphics card (null if they are no longer there to be read).
function back(a, C, n) {
  const gl = GL, b = a._glb;
  if (!gl || !b || gl.isContextLost() || GONE.has(b)) return null;
  const out = new C(n);
  gl.bindBuffer(gl.COPY_READ_BUFFER, b); gl.getBufferSubData(gl.COPY_READ_BUFFER, 0, out); gl.bindBuffer(gl.COPY_READ_BUFFER, null);
  backs++; return out;
}
function letGo(a) {
  const arr = a.array, C = arr.constructor, n = arr.length;
  freedV += arr.byteLength;
  Object.defineProperty(a, 'array', {
    configurable: true, enumerable: true,
    get() { const v = back(this, C, n); delete this.array; this.array = v; this._card = false; this._dyn = true; return v; },
    set(v) { delete this.array; this.array = v; this._card = false; this._dyn = true; },
  });
  a._card = true;
}

// Called once the renderer exists. (Phones only: on a computer this does nothing. The vertices' part only with ?onecopy.)
export function keepOnCard(renderer) {
  if (!LOWMEM || R) return;
  R = renderer;
  if (!ONECOPY) return;
  const gl = renderer.getContext();
  if (!gl.COPY_READ_BUFFER || !gl.getBufferSubData) return;      // (WebGL 1: no reading back, so no vertices are let go)
  GL = gl;
  // which buffer three.js has just made: the attribute's, when it says it has sent one up (below)
  const make = gl.createBuffer.bind(gl); gl.createBuffer = () => (fresh = make());
  // and which have been deleted since (asking the context, isBuffer, waits on the graphics card: thousands of times, a stall)
  const del = gl.deleteBuffer.bind(gl); gl.deleteBuffer = b => { if (b) GONE.add(b); return del(b); };
  const B = THREE.BufferAttribute.prototype;
  B.onUploadCallback = function () {
    // (made just now: its first time up, or up again after a dispose)
    if (fresh && (fresh === gl.getParameter(gl.ARRAY_BUFFER_BINDING) || fresh === gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING))) { this._glb = fresh; fresh = null; WAIT.push([this, performance.now()]); return; }
    this._dyn = true;                    // sent up again into the buffer it had: something writes to it
  };
  // A geometry let go of by whoever made it, and perhaps drawn again later: its vertices are read back first, while the
  // card still has them.
  const G = THREE.BufferGeometry.prototype, dispose = G.dispose;
  G.dispose = function () { if (onCard(this)) { if (isCard(this.index)) void this.index.array; for (const k in this.attributes) if (isCard(this.attributes[k])) void this.attributes[k].array; } return dispose.call(this); };
}

// The textures made from painted-once canvases, found under root (call it when the world is built, and again for
// whatever is built later).
// now: at once (behind the loading bar); otherwise a millisecond of it a frame from settle(), since the whole walk costs
// a phone some tens of milliseconds (5 to 9 ms in a desktop browser).
let walk = null;
export function watch(root, now = false) {
  if (!R) return;
  if (now) { walk = [root]; look(Infinity); } else if (!walk) walk = [root];
}
const addPic = t => { if (!t || !t.isTexture || !t.source) return; const c = t.source.data; if (!c || !ONCE.has(c) || !c.width) return; let e = PICS.get(c); if (!e) PICS.set(c, e = { tex: new Set(), at: 0 }); e.tex.add(t); };
function look(ms) {
  const until = performance.now() + ms; let n = 0;
  while (walk && walk.length) {
    const o = walk.pop();
    for (const m of [].concat(o.material || [])) { if (!m) continue; for (const k in m) { const x = m[k]; if (x && x.isTexture) addPic(x); } if (m.uniforms) for (const k in m.uniforms) { const u = m.uniforms[k]; if (u && u.value && u.value.isTexture) addPic(u.value); } }
    for (let i = 0; i < o.children.length; i++) walk.push(o.children[i]);
    if ((++n & 31) === 0 && performance.now() > until) return;
  }
  walk = null;
}

// Twice a second, from the frame (in play only: main.js): let go of what has stood long enough on the card, a few
// milliseconds of it at a time (the first time, a few seconds into play, there are thousands).
let tick = 0;
export function settle(renderer, dt) {
  if (!R) return;
  if (walk) look(1);
  if ((tick += dt) < 0.5) return; tick = 0;
  const now = performance.now(), gl = renderer.getContext();
  if (gl.isContextLost()) return;
  let i = 0;
  const until = now + BUDGET;
  for (; GL && i < WAIT.length && now - WAIT[i][1] > SETTLE && ((i & 63) || performance.now() < until); i++) {
    const a = WAIT[i][0];
    if (a._dyn || a._card || a.isInstancedBufferAttribute || a.usage !== THREE.StaticDrawUsage || !a.array || !a.array.length || !a._glb || GONE.has(a._glb)) continue;
    letGo(a);
  }
  if (i) WAIT.splice(0, i);
  const P = renderer.properties;
  for (const [c, e] of PICS) {
    if (performance.now() > until) break;
    if (!c.width) { PICS.delete(c); continue; }
    let up = true; for (const t of e.tex) { const q = P.get(t); if (!q.__webglTexture || q.__version !== t.version) { up = false; break; } }
    if (!up) { e.at = 0; continue; }
    if (!e.at) { e.at = now; continue; }
    if (now - e.at < SETTLE) continue;
    // a quarter of the size each way, for three.js to fall back on
    const W = c.width, H = c.height, w = Math.max(1, Math.round(W / 4)), h = Math.max(1, Math.round(H / 4));
    let s;
    if (typeof c.getContext === 'function') {
      s = document.createElement('canvas'); s.width = w; s.height = h;
      try { const g = s.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, w, h); } catch { /* left blank */ }
      freedC += (W * H - w * h) * 4;
      c.width = c.height = 0;            // its memory, given back
    } else {
      const d = c.data, n = d.length / (W * H), o = new d.constructor(w * h * n);      // (every fourth texel each way)
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const a = ((j * 4) * W + i * 4) * n, b = (j * w + i) * n; for (let q = 0; q < n; q++) o[b + q] = d[a + q]; }
      s = { data: o, width: w, height: h }; freedC += d.byteLength - o.byteLength;
    }
    for (const t of e.tex) { t.source.data = s; t.source._card = true; t.source._w = W; t.source._h = H; }
    PICS.delete(c);
  }
}
// (For ?perf and the tests: what has been let go, in bytes, and how often anything was read back.)
export const settled = () => ({ vertices: freedV, canvas: freedC, readBack: backs, waiting: WAIT.length, pictures: PICS.size });
