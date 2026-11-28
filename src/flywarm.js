// Warming: things sent up to the graphics card, and their shaders compiled, a few milliseconds a frame, before they are
// first seen. (On a phone, src/main.js prepare() does not do it all behind the loading bar: at once, that peak killed the
// page. So the opening does it here, for what its flight will show, while she is still in her room.)
//
// The first drawing of a thing is what costs: its shader compiled, its pictures and its vertices sent up. Safari does
// that work in its own graphics process, so the game's frame does not see it, and the frame counter says 60 while the
// screen stands still. Here each thing is drawn once, ahead of time, into a target one pixel square that nobody sees:
// its pictures first (initTexture, which sends nothing else), then the things themselves, a handful at a time, on a
// layer only the warming camera draws, with every light in the scene on that layer too, so that each shader is compiled
// exactly as the real view will want it (three.js keys a shader by the lights it is lit by).
//
//   const w = flyWarm(renderer, scene, objects, { budget: 5, reveal }); ... each frame: w.step(); ... w.done
// reveal: groups kept hidden for now (a feature waiting for the toy) that are shown for the warming's drawing only.
// compile: groups whose shaders are only compiled (as `camera` will see them: the lights it draws), one group a frame,
// first of all: what the game shows by itself when it starts (the probe, the park's own effects), wherever it is.

import * as THREE from 'three';

export const WARM = 10;                    // a layer nothing else uses: drawn only by the warming camera
const NOOP = THREE.Object3D.prototype.onBeforeRender;

export function flyWarm(renderer, scene, objects, { budget = 5, reveal = [], compile = [], camera = null } = {}) {
  const R = renderer, rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: true });
  const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 10); cam.layers.set(WARM);
  // (A thing with a hook of its own when it is drawn, a mirror or a live picture, is left to be drawn when it is seen: its hook could draw a world of its own from this camera.)
  const things = objects.filter(o => o && (o.isMesh || o.isPoints || o.isLine || o.isSprite) && o.onBeforeRender === NOOP);
  const tex = new Set();
  for (const o of things) for (const m of [].concat(o.material || [])) {
    for (const k in m) { const x = m[k]; if (x && x.isTexture) tex.add(x); }
    if (m.uniforms) for (const k in m.uniforms) { const x = m.uniforms[k] && m.uniforms[k].value; if (x && x.isTexture) tex.add(x); }
  }
  const pics = [...tex].filter(x => !x.isRenderTargetTexture && !x.isVideoTexture && x.version > 0 && x.image && x.image.complete !== false);
  let ci = 0, pi = 0, oi = 0, lights = null;
  const w = {
    done: false, sent: 0, drawn: 0, ms: 0,
    step() {
      if (w.done) return true;
      const t0 = performance.now();
      try {
        if (ci < compile.length && camera) {
          const was = R.getRenderTarget(); R.setRenderTarget(rt);      // (into a target like the composer's, as the real view draws: not the screen)
          try { do R.compile(compile[ci++], camera, scene); while (ci < compile.length && performance.now() - t0 < budget * 0.5); } finally { R.setRenderTarget(was); }
          w.ms += performance.now() - t0; return false;
        }
        while (pi < pics.length && performance.now() - t0 < budget) { const x = pics[pi++]; if (!(R.properties.get(x) || {}).__webglTexture) { R.initTexture(x); w.sent++; } }
        if (pi >= pics.length && oi < things.length && performance.now() - t0 < budget) {
          if (!lights) { lights = []; scene.traverse(o => { if (o.isLight) lights.push(o); }); }
          const was = R.getRenderTarget(), batch = [];
          // a handful at a time, as many as the frame has room for (judged by the last handful)
          const n = w.per ? Math.max(4, Math.min(80, Math.floor((budget - (performance.now() - t0)) / w.per))) : 12;
          while (oi < things.length && batch.length < n) { const o = things[oi++]; batch.push([o, o.layers.mask, o.frustumCulled]); o.layers.enable(WARM); o.frustumCulled = false; }
          const lm = lights.map(l => l.layers.mask); for (const l of lights) l.layers.enable(WARM);
          const rv = reveal.map(g => g.visible); for (const g of reveal) g.visible = true;
          const s = performance.now();
          try { R.setRenderTarget(rt); R.render(scene, cam); }
          finally {
            R.setRenderTarget(was);
            for (const [o, mask, fc] of batch) { o.layers.mask = mask; o.frustumCulled = fc; }
            lights.forEach((l, i) => { l.layers.mask = lm[i]; });
            reveal.forEach((g, i) => { g.visible = rv[i]; });
          }
          w.per = Math.max(0.02, (performance.now() - s) / batch.length); w.drawn += batch.length;
        }
      } catch (e) { console.warn('warm', e); ci = compile.length; oi = things.length; pi = pics.length; }
      w.ms += performance.now() - t0;
      if (ci >= compile.length && pi >= pics.length && oi >= things.length) { w.done = true; rt.dispose(); }
      return w.done;
    },
  };
  return w;
}
