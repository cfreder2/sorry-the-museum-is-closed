// ?perf: a panel for finding out, on the device in hand, what a frame is spent on. Loaded only with the word in the
// address (main.js); nothing here runs or is fetched without it.
//
// It reads, over the last two seconds: frames a second, the usual and the worst frame, how much of the frame the game's
// own frame function takes (if that is nearly all of it, the processor is what is slow; if it is a small part, the
// graphics card), and the draw calls and triangles of one frame. And it switches things off, one at a time, so the
// difference each makes can be read: the trees (or only their near, heavy version), the light show, the glow, the
// smoothing of edges, the sharpness, and whatever is costing most in the view (SCAN: the biggest groups being drawn
// now, by draw calls). While it is open the governor (main.js, govern) is held still, so that it does not change
// things in the middle of a comparison. COPY puts the readout and what is switched off on the clipboard.
//
// Things are switched off as they are drawn (the scene's onBeforeRender), because much of the world sets its own
// visibility every frame and would switch itself back on. Opened from the PERF button under the frame counter; taps
// on the panel are not taps on the story (src/opening.js leaves .perfp alone).

export function perfPanel(G, kit) {
  const { quality, bloom, composer, resize, renderer, scene } = kit;
  const off = new Map();                      // object -> what its own visibility was when it was switched off here
  const st = { trees: 'normal', show: true, glow: true, msaa: true, pr: 0, open: false };
  const frames = [], calls = [], tris = [], at = [];      // the last two seconds of frames, since the last change made here
  let since = 0;
  let scanned = [];

  // ---- switching off, as the scene is drawn
  const prevBefore = scene.onBeforeRender;
  scene.onBeforeRender = function (...a) {
    if (prevBefore) prevBefore.apply(this, a);
    for (const o of off.keys()) o.visible = false;
    const trees = []; scene.traverse(o => { if (o.isLOD && o.name === 'trees') trees.push(o); });
    for (const t of trees) {
      if (st.trees === 'normal') { t.autoUpdate = true; continue; }
      t.autoUpdate = false;
      const L = t.levels; for (let i = 0; i < L.length; i++) L[i].object.visible = st.trees === 'far' ? i === L.length - 1 : false;
    }
  };
  const hide = (o, yes) => {
    if (yes && !off.has(o)) { off.set(o, o.visible); o.visible = false; }
    else if (!yes && off.has(o)) { o.visible = off.get(o); off.delete(o); }
  };

  // ---- the readout: one frame's draw calls, counted from one of this panel's frames to the next
  renderer.info.autoReset = false;
  let last = performance.now();
  const loop = now => {
    requestAnimationFrame(loop);
    frames.push(now - last); at.push(now); last = now;
    calls.push(renderer.info.render.calls); tris.push(renderer.info.render.triangles); renderer.info.reset();
    while (at.length && (at[0] < since || at[0] < now - 2000 && at.length > 5)) { frames.shift(); calls.shift(); tris.shift(); at.shift(); }
  };
  requestAnimationFrame(loop);
  const med = a => { const s = a.slice().sort((p, q) => p - q); return s.length ? s[s.length >> 1] : 0; };

  // ---- the page
  const css = document.createElement('style');
  css.textContent = `.perfp{position:fixed;z-index:60;font:12px/1.35 ui-monospace,Menlo,Consolas,monospace;color:#dfe;-webkit-user-select:none;user-select:none}
.perfp.btn{top:calc(env(safe-area-inset-top) + 30px);left:50%;transform:translateX(-50%);padding:4px 10px;background:rgba(0,0,0,.75);border:1px solid #6a8;border-radius:6px;cursor:pointer}
.perfp.pane{top:calc(env(safe-area-inset-top) + 8px);left:calc(env(safe-area-inset-left) + 8px);width:min(360px,calc(100vw - 16px));max-height:calc(100vh - 16px);overflow:auto;padding:8px;background:rgba(0,8,6,.88);border:1px solid #6a8;border-radius:8px}
.perfp pre{margin:0 0 6px;white-space:pre-wrap}
.perfp .row{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0}
.perfp b{display:inline-block;padding:5px 8px;border:1px solid #487;border-radius:5px;background:#0c1a16;font-weight:normal;cursor:pointer}
.perfp b.on{background:#7a2626;border-color:#d66}
.perfp .k{color:#8ab;margin-top:6px}`;
  document.head.append(css);
  const btn = document.createElement('div'); btn.className = 'perfp btn'; btn.textContent = 'PERF';
  const pane = document.createElement('div'); pane.className = 'perfp pane'; pane.hidden = true;
  document.body.append(btn, pane);
  const read = document.createElement('pre');
  const fixed = document.createElement('div'), list = document.createElement('div');
  pane.append(read, fixed, list);

  const open = yes => {
    st.open = yes; pane.hidden = !yes; btn.hidden = yes; since = performance.now();
    quality.hold = yes;                          // the governor holds still while comparisons are made
  };
  btn.addEventListener('click', () => open(true));

  const button = (label, onTap, isOn, change = true) => {
    const b = document.createElement('b'); b.textContent = label;
    const paint = () => b.classList.toggle('on', !!isOn());
    b.addEventListener('click', () => { onTap(); paint(); if (change) since = performance.now() + 300; draw(); });      // (measured afresh, from a moment after the change)
    b._paint = paint; paint(); return b;
  };
  const row = (...bs) => { const r = document.createElement('div'); r.className = 'row'; r.append(...bs); return r; };
  const label = t => { const d = document.createElement('div'); d.className = 'k'; d.textContent = t; return d; };

  const show = () => scene.getObjectByName('lightshow');
  const setMsaa = on => {
    st.msaa = on;
    for (const rt of [composer.renderTarget1, composer.renderTarget2]) { rt.samples = on ? 4 : 0; rt.dispose(); }
  };
  const setPr = v => { st.pr = v; quality.pr = v || 0; resize(); };
  const prLabel = () => st.pr ? 'sharpness ' + st.pr : 'sharpness auto';

  const drawFixed = () => {
    fixed.replaceChildren(
      label('switch off (red = off)'),
      row(
        button('trees', () => { st.trees = st.trees === 'none' ? 'normal' : 'none'; }, () => st.trees === 'none'),
        button('trees: far only', () => { st.trees = st.trees === 'far' ? 'normal' : 'far'; }, () => st.trees === 'far'),
        button('light show', () => { st.show = !st.show; const s = show(); if (s) hide(s, !st.show); }, () => !st.show),
      ),
      row(
        button('glow', () => { st.glow = !st.glow; bloom.enabled = st.glow; }, () => !st.glow),
        button('smoothing (MSAA)', () => setMsaa(!st.msaa), () => !st.msaa),
        button(prLabel(), () => { setPr(st.pr === 0 ? 1.25 : st.pr === 1.25 ? 1 : 0); drawFixed(); }, () => st.pr !== 0),
      ),
      row(
        button('SCAN view', scan, () => false, false),
        button('all back on', reset, () => false),
        button('COPY', copy, () => false, false),
        button('close', () => open(false), () => false, false),
      ),
    );
  };

  // The biggest groups being drawn now: the main view's list, grouped two levels under the scene (and under the
  // museum's group and the features' group, which hold most of the world).
  function scan() {
    const L = renderer.renderLists.get(scene, 0), items = [...L.opaque, ...L.transmissive, ...L.transparent];
    const roots = new Set([scene]); if (G.museum && G.museum.group) roots.add(G.museum.group);
    scene.traverse(o => { if (o.name === 'features') roots.add(o); });
    const by = new Map();
    for (const it of items) {
      let o = it.object, key = null;
      while (o && o.parent) { if (roots.has(o.parent) && !roots.has(o)) { key = o; break; } o = o.parent; }
      if (!key) continue;
      const g = it.geometry, n = g ? (g.index ? g.index.count : g.attributes.position ? g.attributes.position.count : 0) / 3 * (it.object.isInstancedMesh ? it.object.count : 1) : 0;
      const e = by.get(key) || { o: key, c: 0, t: 0 }; e.c++; e.t += n; by.set(key, e);
    }
    scanned = [...by.values()].sort((a, b) => b.c - a.c || b.t - a.t).slice(0, 12);
    for (const o of off.keys()) if (!scanned.some(s => s.o === o) && o !== show()) scanned.push({ o, c: 0, t: 0 });
    drawList();
  }
  const nameOf = o => {
    if (o.name) return o.name;
    const known = new Map([[G.props && G.props.group, 'props (ramps, snowmen…)'], [G.loose && G.loose.group, 'loose things (café)'], [G.race && G.race.group, 'race'],
      [G.car && G.car.group, 'car'], [G.drone && G.drone.group, 'drone']]);      // (looked up now: the panel is made before the game is)
    if (known.has(o)) return known.get(o);
    let n = null; o.traverse(q => { if (!n && q.name) n = q.name; });
    return (n ? n + ' …' : o.type) + ' #' + o.id + (o.children.length ? ` (${o.children.length} inside)` : '');
  };
  function drawList() {
    list.replaceChildren(label(scanned.length ? 'biggest in this view (calls · triangles): tap to switch off' : ''),
      ...scanned.map(s => row(button(`${nameOf(s.o)}  ${s.c} · ${Math.round(s.t / 1000)}k`, () => hide(s.o, !off.has(s.o)), () => off.has(s.o)))));
  }
  function reset() {
    for (const o of [...off.keys()]) hide(o, false);
    st.trees = 'normal'; st.show = true; st.glow = true; bloom.enabled = quality.glow; if (!st.msaa) setMsaa(true); if (st.pr) setPr(0);
    drawFixed(); drawList();
  }
  function text() {
    const f = frames, m = med(f), worst = Math.max(0, ...f);
    if (f.length < 5) return 'measuring…';
    const busy = quality.busy || 0, offNow = [
      st.trees !== 'normal' && (st.trees === 'far' ? 'trees: far only' : 'trees'), !st.show && 'light show', !st.glow && 'glow', !st.msaa && 'MSAA',
      st.pr && 'sharpness ' + st.pr, ...[...off.keys()].filter(o => o !== show()).map(nameOf)].filter(Boolean);
    const where = G.state === 'opening' && G.opening ? `opening · ${G.opening.phase}${G.opening.phase === 'room' ? ' card ' + G.opening.ci : ''}` : G.state;
    return [
      `${m ? Math.round(1000 / m) : 0} fps · ${m.toFixed(1)} ms usual · ${worst.toFixed(0)} ms worst`,
      `frame function ${busy.toFixed(1)} ms of ${m.toFixed(1)} (${busy > 0.7 * m ? 'processor-bound' : busy < 0.45 * m ? 'graphics-bound' : 'mixed'})`,
      `${med(calls)} calls · ${(med(tris) / 1e6).toFixed(2)} M triangles`,
      `canvas ${renderer.domElement.width}x${renderer.domElement.height} · pixel ratio ${renderer.getPixelRatio()} · camera fov ${G.camera ? G.camera.fov.toFixed(0) : '?'}`,
      `${where} · governor held: ${quality.hold ? 'yes' : 'no'} (step ${quality.step})`,
      `off: ${offNow.length ? offNow.join(', ') : 'nothing'}`,
    ].join('\n');
  }
  function copy() { const t = text(); if (navigator.clipboard) navigator.clipboard.writeText(t).catch(() => {}); }
  function draw() { read.textContent = text(); }
  setInterval(() => { if (st.open) draw(); }, 500);
  drawFixed();
  return { open, scan, text, samples: () => ({ frames: frames.slice(-5), calls: calls.slice(-5), tris: tris.slice(-5) }) };
}
