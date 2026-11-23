// Brushstrokes as marks: many short, feathered dabs of paint in one draw call, each with its own size (in metres, true
// to the camera whatever its field of view), its own turn on the screen and its own colour. Renoir's figures, leaves
// and petals in src/life/81558-acrobats.js and src/life/14655-two-sisters.js are built of them, as the Grande Jatte's
// dancers are built of dots: the figures are made of the painter's own marks.
//
//   const S = strokes(L, 400);           // up to 400 strokes; S.points is already L.add()ed (so guarded)
//   S.set(i, x, y, z, size, turn);       // each frame for the ones in use (turn: radians on the screen, 0 = across)
//   S.color(i, color);                   // once, or when it changes (a THREE.Color, linear)
//   S.count = n; S.flush();              // draw the first n
//   S.angle(a, b)                        // the screen angle of the line from world point a to b, from the camera now
//
// A point sprite is hidden whole by the guard if any of it could be over a canvas (src/paintlife.js), so keep strokes
// small near the frame.
import * as THREE from 'three';
import { canvasTexture } from '../paintlife.js';

let TEX = null;
// One feathered stroke, lying across a square: a tapered body of parallel bristle lines, ragged at both ends.
function strokeTexture() {
  if (TEX) return TEX;
  TEX = canvasTexture(128, 128, (g, w, h) => {
    let s = 7; const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    g.clearRect(0, 0, w, h);
    g.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const y = h / 2 + (r() - 0.5) * h * 0.34, k = 1 - Math.abs(y - h / 2) / (h * 0.19);        // fuller in the middle
      const x0 = w * (0.1 + r() * 0.12 + (1 - k) * 0.12), x1 = w * (0.9 - r() * 0.12 - (1 - k) * 0.12);
      g.strokeStyle = `rgba(255,255,255,${0.55 + 0.45 * r()})`; g.lineWidth = 3 + r() * 5;
      g.beginPath(); g.moveTo(x0, y + (r() - 0.5) * 4); g.quadraticCurveTo(w / 2, y - 3 + (r() - 0.5) * 5, x1, y + (r() - 0.5) * 6); g.stroke();
    }
    // the body, so it holds together
    g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.33, h * 0.12, 0, 0, Math.PI * 2); g.fill();
  }, false);
  return TEX;
}

export function strokes(L, n, { parent = L.group, bright = 1 } = {}) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3).fill(1), size = new Float32Array(n), turn = new Float32Array(n);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aTurn', new THREE.BufferAttribute(turn, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setDrawRange(0, 0);
  const mat = new THREE.PointsMaterial({ size: 1, sizeAttenuation: true, vertexColors: true, map: strokeTexture(), alphaTest: 0.42, transparent: false, fog: false, color: new THREE.Color(bright, bright, bright) });
  mat.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aSize; attribute float aTurn; varying float vTurn;')
      // True size in metres, for whatever is being drawn into (the screen, the floor's reflection, a check): the guard's
      // own pixels-per-metre (uLifePx, set for each target; three's `scale` is the canvas's, wrong in a smaller target).
      // And hidden whole if any of the square could lie over a canvas: the guard's own test sizes a point by `scale`.
      .replace(/gl_PointSize = size;[\s\S]*?#endif/, `gl_PointSize = aSize * uLifePx / max(-mvPosition.z, 0.01); vTurn = aTurn;
  if (uLifeOff < 0.5 && lifeOut(cameraPosition, (modelMatrix * vec4(position, 1.0)).xyz, aSize * 0.72) < 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vTurn;')
      .replace('#include <map_particle_fragment>', `{
  vec2 pc = gl_PointCoord - 0.5; float cs = cos(vTurn), sn = sin(vTurn);
  vec2 q = vec2(cs * pc.x - sn * pc.y, sn * pc.x + cs * pc.y) + 0.5;      // (gl_PointCoord runs down the screen)
  diffuseColor *= texture2D(map, vec2(q.x, 1.0 - q.y));
}`);
  };
  mat.customProgramCacheKey = () => 'life-strokes';
  const pts = new THREE.Points(geo, mat); pts.name = 'strokes';
  L.add(pts, parent);
  const P = new THREE.Vector3(), Q = new THREE.Vector3();
  const S = {
    points: pts, n, count: 0, pos, col, size, turn,
    set(i, x, y, z, s, t) { const j = i * 3; pos[j] = x; pos[j + 1] = y; pos[j + 2] = z; size[i] = s; turn[i] = t; },
    color(i, c) { const j = i * 3; col[j] = c.r; col[j + 1] = c.g; col[j + 2] = c.b; },
    colorsChanged() { geo.attributes.color.needsUpdate = true; },
    flush() {
      geo.setDrawRange(0, S.count); pts.visible = S.count > 0;
      geo.attributes.position.needsUpdate = true; geo.attributes.aSize.needsUpdate = true; geo.attributes.aTurn.needsUpdate = true;
    },
    // The angle on the screen (as aTurn wants it) of the line from a to b, seen from the game's camera now.
    angle(a, b) {
      const cam = L.k.G.camera; P.copy(a).project(cam); Q.copy(b).project(cam);
      return Math.atan2((Q.y - P.y), (Q.x - P.x) * (cam.aspect || 1.6));
    },
  };
  return S;
}
