// Pictures for the voyage's sky in assets/space, made for this game with an image generator (Codex, gpt-image; no photographs):
// the Earth by day and by night, the Moon, Mars, Venus, Jupiter, Saturn, the Milky Way, and the
// lunar ground. They are asked for only once the voyage starts, and each replaces the canvas-painted one in
// src/cosmos.js as it arrives; if one cannot be had, the painted one stays.

import * as THREE from 'three';

const BASE = new URL('../assets/space/', import.meta.url);
// name: [file, kept as the canvas draws it (for the Earth's own shader) or as a colour picture]
const FILES = { earthDay: ['earth-day.jpg', true], earthNight: ['earth-night.jpg', true], moon: ['moon.jpg'], mars: ['mars.jpg'], venus: ['venus.jpg'], jupiter: ['jupiter.jpg'], saturn: ['saturn.jpg'], milkyway: ['milkyway.jpg'], regolith: ['regolith.jpg'] };

export function loadSpaceTextures(v) {
  v.spaceTex = v.spaceTex || {};
  const loader = new THREE.TextureLoader();
  return Promise.all(Object.entries(FILES).map(([name, [file, raw]]) => new Promise(res => {
    loader.load(new URL(file, BASE).href, t => {
      if (!raw) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      if (!v.on || !v.on()) { t.dispose(); return res(); }
      v.spaceTex[name] = t; applySpaceTextures(v); res();
    }, undefined, () => res());
  })));
}

// Put whatever has arrived where it belongs. Called again when the Moon is built.
export function applySpaceTextures(v) {
  const T = v.spaceTex || {}, used = v._texUsed || (v._texUsed = new Set());
  const once = (name, fn) => { if (T[name] && !used.has(name + (fn.key || ''))) { used.add(name + (fn.key || '')); fn(T[name]); } };
  if (v.earth) {
    const u = v.earth.userData.mat.uniforms;
    once('earthDay', t => { u.uDay.value.dispose(); u.uDay.value = t; });
    once('earthNight', t => { u.uNight.value.dispose(); u.uNight.value = t; u.uLights.value = 1.9; });
  }
  if (v.moonBall) once('moon', t => { const m = v.moonBall.material; if (m.map) m.map.dispose(); m.map = t; m.color.set(0xffffff); m.needsUpdate = true; });
  for (const p of v.planets || []) {
    const kind = p.userData.kind; if (!['mars', 'venus', 'jupiter', 'saturn'].includes(kind)) continue;
    once(kind, t => { const m = p.children[0].material; if (m.map) m.map.dispose(); m.map = t; m.color.set(0xffffff); m.needsUpdate = true; });
  }
  if (v.stars) once('milkyway', t => {
    // a band round the sky along the same great circle as the painted one
    t.wrapS = THREE.RepeatWrapping; t.repeat.set(2, 1);
    const R = 780000, band = new THREE.Mesh(new THREE.CylinderGeometry(R, R, R * 0.42, 96, 1, true), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide }));
    band.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.35, 0.86, 0.37).normalize());
    v.stars.add(band); v.milkyBand = band;
  });
  if (v.moonW) { const fn = t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; for (const m of v.moonW.terrainMats) { m.map = t; m.needsUpdate = true; } }; fn.key = 'moon'; once('regolith', fn); }
}
