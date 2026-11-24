// The phone budget. iOS gives a tab a few hundred megabytes of canvas and kills the page outright when the game asks
// for more (it reloads once, then gives up: "Can't open this page"). Every surface here is painted on a canvas at start-up,
// so on a phone, or any device short of memory, a finished canvas that is never drawn on again is handed over at half
// its size (at most 512 px; nothing under 256 px is touched) and the full-size one is let go.
//
//   shrink(canvas)   the canvas to make a texture from: the same one, or a smaller copy (the original is emptied).
//                    Only for canvases nobody draws on again (painted once, at start-up).

export const LOWMEM = (() => {
  try {
    const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    const mem = typeof navigator !== 'undefined' && navigator.deviceMemory;
    const small = typeof screen !== 'undefined' && Math.min(screen.width, screen.height) < 600;
    return !!(coarse || small || (mem && mem <= 4) || /[?&]lowmem\b/.test(location.search));
  } catch { return false; }
})();

export function shrink(c, floor = 256, cap = 512) {
  if (!LOWMEM || !c || !c.width || !c.height || typeof c.getContext !== 'function') return c;
  const m = Math.max(c.width, c.height), target = Math.min(cap, Math.max(floor, m / 2));
  if (target >= m) return c;
  const k = target / m, w = Math.max(1, Math.round(c.width * k)), h = Math.max(1, Math.round(c.height * k));
  const o = document.createElement('canvas'); o.width = w; o.height = h;
  const g = o.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, w, h);
  c.width = c.height = 0;                // its memory, given back
  return o;
}

// Static geometry (the building, the streets: geo.js) keeps a copy of every vertex in script memory after it has gone to
// the graphics card, where it is drawn from. On a phone that copy is let go: marked here, and once it has been sent up,
// sweep() (main.js, every few seconds of play) empties it. Its bounds are worked out first, for culling.
const MARKED = new Set();
export function releasable(geo) {
  for (const a of [...Object.values(geo.attributes), geo.index]) if (a) a.onUpload(function () { this._sent = true; });
  MARKED.add(geo);
}
export function sweep() {
  if (!LOWMEM) return 0;
  let freed = 0;
  for (const geo of MARKED) {
    const all = [...Object.values(geo.attributes), geo.index].filter(Boolean);
    if (!all.every(a => a._sent)) continue;
    if (!geo.boundingSphere) geo.computeBoundingSphere();
    if (!geo.boundingBox) geo.computeBoundingBox();
    for (const a of all) { freed += a.array ? a.array.byteLength : 0; a.array = null; }
    MARKED.delete(geo);
  }
  return freed;
}
