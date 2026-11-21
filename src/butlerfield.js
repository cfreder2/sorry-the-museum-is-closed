// Butler Field, the block of Grant Park between Columbus Drive and Lake Shore Drive (features.js).
// The north-west quarter, facing the Modern Wing across Columbus Drive, is a drive-through winter light show: a winding
// path through arches and tunnels of lights, past figures drawn in glowing wire (reindeer, Santa's sleigh, penguins,
// polar bears, snowmen, candy canes, ornaments, presents, stars, snowflakes overhead) to a great lit tree. The north-east
// is a jump park made of the ploughs' snow piles. The south-east has the field's softball diamonds, under snow, with their
// backstops and benches. Lamps, benches and bins along the paths, a warming hut and a scoreboard lit up for the night.
// Everything is merged or instanced; the lights twinkle and chase in a shader, so nothing is rebuilt per frame.
import * as THREE from 'three';
import { feature } from './features.js';
import { heightOf } from './plan.js';


const TAU = Math.PI * 2;
const canvasTex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const lit = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, emissive: new THREE.Color(color).multiplyScalar(0.3), ...o });

// ---------------------------------------------------------------- bulbs
// Every bulb in the show in one InstancedMesh. Each carries its colour, a phase and a mode; the shader makes them
// twinkle (0), chase along their phase (1), burn steady with a faint breath (2) or run through the colours (3).
class Bulbs {
  constructor() { this.p = []; this.c = []; this.f = []; this.s = []; }
  add(x, y, z, col, phase = Math.random(), mode = 0, size = 0.055) { this.p.push(x, y, z); this.c.push(...col); this.f.push(phase, mode); this.s.push(size); }
  build(group) {
    const n = this.s.length; if (!n) return null;
    const geo = new THREE.OctahedronGeometry(1, 0);
    geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(this.c), 3));
    geo.setAttribute('aPh', new THREE.InstancedBufferAttribute(new Float32Array(this.f), 2));
    this.u = { uT: { value: 0 } };
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    mat.onBeforeCompile = sh => {
      sh.uniforms.uT = this.u.uT;
      sh.vertexShader = 'attribute vec3 aCol; attribute vec2 aPh; uniform float uT; varying vec3 vBulb;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        { float m = aPh.y, ph = aPh.x, b;
          if (m < 0.5) b = 0.5 + 0.7 * pow(0.5 + 0.5 * sin(uT * 2.1 + ph * 6.2831), 4.0);
          else if (m < 1.5) b = 0.16 + 1.25 * pow(max(0.0, sin(uT * 4.2 - ph)), 10.0);
          else if (m < 2.5) b = 0.85 + 0.15 * sin(uT * 1.3 + ph * 6.2831);
          else { float h = fract(uT * 0.12 + ph); vec3 c = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); vBulb = (c * 2.2 + 0.25) * (0.75 + 0.25 * sin(uT * 3.0 + ph * 9.0)); b = -1.0; }
          if (b >= 0.0) vBulb = aCol * b; }`);
      sh.fragmentShader = 'varying vec3 vBulb;\n' + sh.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( vBulb, opacity );');
    };
    const mesh = new THREE.InstancedMesh(geo, mat, n), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3();
    for (let i = 0; i < n; i++) { S.setScalar(this.s[i]); P.set(this.p[i * 3], this.p[i * 3 + 1], this.p[i * 3 + 2]); mesh.setMatrixAt(i, M.compose(P, Q, S)); }
    mesh.frustumCulled = false; group.add(mesh); this.mesh = mesh;
    return mesh;
  }
}

// ---------------------------------------------------------------- glowing wire
// The figures are drawn as strokes: polylines turned into thin four-sided tubes, coloured per stroke, all of one
// figure (or of the whole show) merged into one mesh. Colours above 1 glow under the bloom.
class Wire {
  constructor(r = 0.028) { this.r = r; this.pos = []; this.col = []; }
  stroke(pts, col, M = null, r = this.r) {
    const v = pts.map(p => { const q = new THREE.Vector3(p[0], p[1], p[2] || 0); return M ? q.applyMatrix4(M) : q; });
    const d = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), alt = new THREE.Vector3(1, 0, 0);
    for (let i = 0; i < v.length - 1; i++) {
      const p0 = v[i], p1 = v[i + 1]; d.subVectors(p1, p0); if (d.lengthSq() < 1e-8) continue; d.normalize();
      a.crossVectors(d, Math.abs(d.y) > 0.9 ? alt : up).normalize(); b.crossVectors(d, a).normalize();
      const off = [a.clone().multiplyScalar(r), b.clone().multiplyScalar(r), a.clone().multiplyScalar(-r), b.clone().multiplyScalar(-r)];
      for (let s = 0; s < 4; s++) {
        const o0 = off[s], o1 = off[(s + 1) % 4], A = p0.clone().add(o0), B = p0.clone().add(o1), C = p1.clone().add(o1), D = p1.clone().add(o0);
        for (const q of [A, B, C, A, C, D]) { this.pos.push(q.x, q.y, q.z); this.col.push(col[0], col[1], col[2]); }
      }
    }
  }
  // Strokes drawn in a figure's plane (x along, y up), doubled at ±depth with ties across every few points: a wire frame.
  frame(strokes, depth, M) {
    for (const s of strokes) {
      const { pts, col, d = depth, ties = 3 } = s;
      if (d > 0) {
        this.stroke(pts.map(p => [p[0], p[1], d]), col, M); this.stroke(pts.map(p => [p[0], p[1], -d]), col, M);
        for (let i = 0; i < pts.length; i += ties) this.stroke([[pts[i][0], pts[i][1], d], [pts[i][0], pts[i][1], -d]], col, M);
      } else this.stroke(pts.map(p => [p[0], p[1], p[2] || 0]), col, M);
    }
  }
  mesh() {
    if (!this.pos.length) return null;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true })); m.frustumCulled = false; return m;
  }
}

// ---------------------------------------------------------------- the figures, as strokes
const C = {
  white: [2.1, 2.15, 2.4], warm: [2.6, 1.9, 1.0], gold: [2.8, 1.9, 0.45], red: [2.8, 0.35, 0.3], green: [0.45, 2.4, 0.6], blue: [0.5, 1.1, 2.9],
  ice: [1.2, 2.0, 2.8], pink: [2.6, 0.9, 1.6], orange: [2.9, 1.1, 0.25], amber: [2.2, 1.2, 0.35], purple: [1.6, 0.6, 2.6], brown: [1.6, 0.9, 0.4],
};
const circle = (cx, cy, r, n = 24, a0 = 0, a1 = TAU, rx = r) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * r]; });
const ring3 = (cx, cy, cz, r, axis, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const a = TAU * i / n, c = Math.cos(a) * r, s = Math.sin(a) * r; return axis === 'y' ? [cx + c, cy, cz + s] : axis === 'x' ? [cx, cy + s, cz + c] : [cx + c, cy + s, cz]; });

// A reindeer seen side on, 1.6 m from nose to tail. pose 'stand', 'leap' (legs flung out) or 'graze' (head down: drawn apart).
function deerBody(pose, col = C.warm) {
  const s = [
    { pts: [[1.2, 1.36], [1.05, 1.15], [0.9, 1.05], [0.6, 1.03], [0.3, 1.02], [0.05, 0.95], [0.0, 0.85], [0.08, 0.75], [0.25, 0.7], [0.6, 0.68], [0.95, 0.7], [1.05, 0.75], [1.15, 0.95], [1.25, 1.2]], col, d: 0.17, ties: 2 },
    { pts: [[0.02, 0.92], [-0.1, 1.0], [-0.04, 0.9]], col: C.white, d: 0.04 },
  ];
  const legs = pose === 'leap'
    ? [[[1.0, 0.72], [1.22, 0.6], [1.45, 0.52]], [[0.92, 0.7], [1.12, 0.52], [1.35, 0.4]], [[0.22, 0.72], [-0.02, 0.58], [-0.3, 0.55]], [[0.3, 0.7], [0.08, 0.5], [-0.2, 0.42]]]
    : [[[1.0, 0.72], [1.03, 0.4], [1.0, 0.05]], [[0.9, 0.7], [0.93, 0.38], [0.88, 0.05]], [[0.2, 0.72], [0.12, 0.4], [0.18, 0.05]], [[0.3, 0.7], [0.27, 0.4], [0.3, 0.05]]];
  legs.forEach((l, i) => { const z = i % 2 ? -0.16 : 0.16; s.push({ pts: l.map(([x, y]) => [x, y, z]), col, d: 0 }); });
  return s;
}
// The head, neck to nose, with ears and antlers, in its own frame: (0, 0) is where it joins the neck.
function deerHead(col = C.warm, rudolph = false) {
  const o = [1.22, 1.28], P = pts => pts.map(([x, y]) => [x - o[0], y - o[1]]);
  const s = [
    { pts: P([[1.2, 1.36], [1.28, 1.55], [1.42, 1.6], [1.6, 1.5], [1.63, 1.45], [1.5, 1.41], [1.36, 1.37], [1.25, 1.2]]), col, d: 0.09, ties: 2 },
    { pts: P([[1.33, 1.58], [1.22, 1.68], [1.3, 1.56]]), col, d: 0.1 },
  ];
  for (const z of [-0.09, 0.09]) {
    s.push({ pts: P([[1.36, 1.6], [1.3, 1.82], [1.18, 2.02]]).map(p => [p[0], p[1], z * 1.6]), col: C.gold, d: 0 });
    s.push({ pts: P([[1.3, 1.82], [1.44, 1.96], [1.48, 2.08]]).map(p => [p[0], p[1], z * 1.6]), col: C.gold, d: 0 });
    s.push({ pts: P([[1.24, 1.93], [1.3, 2.08]]).map(p => [p[0], p[1], z * 1.6]), col: C.gold, d: 0 });
    s.push({ pts: P([[1.2, 1.99], [1.08, 2.04]]).map(p => [p[0], p[1], z * 1.6]), col: C.gold, d: 0 });
  }
  s.push({ pts: P(circle(1.64, 1.46, 0.035, 8)), col: rudolph ? C.red : C.white, d: 0 });
  return s;
}
function sleigh() {
  const s = [];
  s.push({ pts: [[-0.2, 0.05], [1.8, 0.05], [2.05, 0.15], [2.15, 0.4], [2.05, 0.6], [1.88, 0.56], [1.94, 0.4]], col: C.gold, d: 0.42, ties: 2 });
  for (const x of [0.2, 0.8, 1.4]) s.push({ pts: [[x, 0.05], [x + 0.03, 0.35]], col: C.gold, d: 0.42 });
  s.push({ pts: [[-0.1, 0.35], [1.6, 0.35], [1.9, 0.75], [1.75, 0.95], [1.5, 0.8], [0.2, 0.8], [0.05, 1.25], [-0.25, 1.3], [-0.32, 1.1], [-0.1, 0.35]], col: C.red, d: 0.4, ties: 2 });
  s.push({ pts: [[0.25, 0.55], [1.4, 0.55]], col: C.gold, d: 0.41, ties: 99 });
  // Santa: body, head, beard, hat with its bobble, an arm out to the reins
  s.push({ pts: circle(0.6, 1.12, 0.32, 20), col: C.red, d: 0.14 });
  s.push({ pts: [[0.3, 1.0], [0.9, 1.0]], col: C.white, d: 0.15 });
  s.push({ pts: circle(0.72, 1.6, 0.16, 16), col: C.pink, d: 0.08 });
  s.push({ pts: [[0.58, 1.55], [0.64, 1.38], [0.72, 1.32], [0.82, 1.38], [0.88, 1.55]], col: C.white, d: 0.09 });
  s.push({ pts: [[0.55, 1.72], [0.66, 1.98], [0.84, 2.08], [0.9, 1.74]], col: C.red, d: 0.08 });
  s.push({ pts: circle(0.84, 2.1, 0.06, 8), col: C.white, d: 0 });
  s.push({ pts: [[0.55, 1.73], [0.9, 1.73]], col: C.white, d: 0.1 });
  s.push({ pts: [[0.82, 1.2], [1.05, 1.2], [1.3, 1.28]], col: C.red, d: 0.12 });
  // the sack, spilling presents
  s.push({ pts: [[-0.05, 0.82], [-0.25, 1.3], [-0.05, 1.62], [0.22, 1.5], [0.28, 0.82]], col: C.brown, d: 0.22 });
  s.push({ pts: [[-0.22, 1.58], [-0.1, 1.82], [0.1, 1.82], [0.12, 1.6]], col: C.green, d: 0.12 });
  s.push({ pts: [[-0.05, 1.82], [-0.02, 1.6]], col: C.gold, d: 0.12 });
  return s;
}
function penguin() {
  return [
    { pts: circle(0, 0.72, 0.62, 28, 0, TAU, 0.4), col: C.blue, d: 0.18, ties: 4 },
    { pts: circle(0, 0.64, 0.46, 24, 0, TAU, 0.26), col: C.white, d: 0.2 },
    { pts: circle(-0.12, 1.13, 0.05, 8), col: C.white, d: 0.22 }, { pts: circle(0.12, 1.13, 0.05, 8), col: C.white, d: 0.22 },
    { pts: [[-0.07, 1.02], [0, 0.92], [0.07, 1.02], [-0.07, 1.02]], col: C.orange, d: 0.24 },
    { pts: [[-0.38, 0.92], [-0.62, 0.5], [-0.42, 0.52]], col: C.blue, d: 0.1 }, { pts: [[0.38, 0.92], [0.62, 0.5], [0.42, 0.52]], col: C.blue, d: 0.1 },
    { pts: [[-0.3, 0.04], [-0.05, 0.04], [-0.15, 0.14]], col: C.orange, d: 0.15 }, { pts: [[0.3, 0.04], [0.05, 0.04], [0.15, 0.14]], col: C.orange, d: 0.15 },
  ];
}
function polarBear() {
  return [
    { pts: [[0.05, 0.62], [0.15, 0.85], [0.55, 0.95], [1.0, 0.93], [1.2, 0.86], [1.32, 0.92], [1.5, 0.95], [1.68, 0.85], [1.8, 0.74], [1.72, 0.68], [1.55, 0.66], [1.42, 0.6], [1.35, 0.45], [1.3, 0.05], [1.12, 0.05], [1.1, 0.38], [0.6, 0.38], [0.5, 0.05], [0.32, 0.05], [0.28, 0.4], [0.1, 0.45], [0.05, 0.62]], col: C.ice, d: 0.26, ties: 2 },
    { pts: [[1.38, 0.93], [1.4, 1.03], [1.48, 0.96]], col: C.ice, d: 0.16 },
    { pts: circle(1.6, 0.82, 0.025, 6), col: C.blue, d: 0.12 }, { pts: circle(1.79, 0.74, 0.03, 6), col: C.blue, d: 0 },
  ];
}
function snowman(scale = 1, scarf = C.red) {
  const s = [];
  for (const [y, r] of [[0.42, 0.42], [1.08, 0.3], [1.55, 0.21]]) {
    s.push({ pts: ring3(0, y * scale, 0, r * scale, 'z'), col: C.white, d: 0 }); s.push({ pts: ring3(0, y * scale, 0, r * scale, 'x'), col: C.white, d: 0 });
    s.push({ pts: ring3(0, y * scale, 0, r * scale, 'y'), col: C.white, d: 0 });
  }
  const k = scale;
  s.push({ pts: [[-0.27 * k, 1.74 * k], [0.27 * k, 1.74 * k]], col: C.red, d: 0.12 * k });
  s.push({ pts: [[-0.16 * k, 1.74 * k], [-0.16 * k, 2.02 * k], [0.16 * k, 2.02 * k], [0.16 * k, 1.74 * k]], col: C.red, d: 0.1 * k });
  s.push({ pts: [[-0.24 * k, 1.33 * k], [0, 1.28 * k], [0.24 * k, 1.33 * k], [0.18 * k, 1.05 * k]], col: scarf, d: 0.18 * k });
  s.push({ pts: [[0, 1.55 * k, 0.21 * k], [0, 1.53 * k, 0.42 * k]], col: C.orange, d: 0 });
  for (const sx of [-1, 1]) {
    s.push({ pts: [[sx * 0.28 * k, 1.12 * k], [sx * 0.7 * k, 1.38 * k], [sx * 0.86 * k, 1.36 * k]], col: C.brown, d: 0 });
    s.push({ pts: [[sx * 0.6 * k, 1.32 * k], [sx * 0.7 * k, 1.5 * k]], col: C.brown, d: 0 });
    s.push({ pts: circle(sx * 0.07 * k, 1.62 * k, 0.025 * k, 6).map(p => [p[0], p[1], 0.19 * k]), col: C.blue, d: 0 });
  }
  return s;
}
function candyCane() {
  const path = [];
  for (let y = 0; y <= 1.6; y += 0.08) path.push([0, y]);
  for (let i = 1; i <= 14; i++) { const a = Math.PI - Math.PI * i / 14; path.push([0.3 + Math.cos(a) * 0.3, 1.6 + Math.sin(a) * 0.3]); }
  path.push([0.6, 1.5]); path.push([0.6, 1.4]);
  const s = [];
  for (let i = 0; i < path.length - 1; i++) s.push({ pts: [path[i], path[i + 1]], col: (Math.floor(i / 2) % 2) ? C.white : C.red, d: 0.05, ties: 1 });
  return s;
}
function ornament(col, r = 0.75) {
  const s = [], y = r + 0.08;
  for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; s.push({ pts: Array.from({ length: 29 }, (_, j) => { const t = TAU * j / 28; return [Math.cos(t) * r * Math.cos(a), y + Math.sin(t) * r, Math.cos(t) * r * Math.sin(a)]; }), col, d: 0 }); }
  for (const h of [-0.5, 0, 0.5]) { const rr = r * Math.sqrt(1 - h * h); s.push({ pts: ring3(0, y + h * r, 0, rr, 'y'), col: h ? col : C.gold, d: 0 }); }
  s.push({ pts: ring3(0, y + r + 0.1, 0, 0.13, 'y', 12), col: C.gold, d: 0 }); s.push({ pts: circle(0, y + r + 0.26, 0.09, 10), col: C.gold, d: 0 });
  return s;
}
function present(w, h, d, box, ribbon) {
  const s = [], X = w / 2, Z = d / 2, E = [[-X, 0, -Z], [X, 0, -Z], [X, 0, Z], [-X, 0, Z]];
  for (const y of [0.02, h]) s.push({ pts: [...E, E[0]].map(p => [p[0], y, p[2]]), col: box, d: 0 });
  for (const p of E) s.push({ pts: [[p[0], 0.02, p[2]], [p[0], h, p[2]]], col: box, d: 0 });
  s.push({ pts: [[0, 0.02, -Z], [0, h, -Z], [0, h, Z], [0, 0.02, Z]], col: ribbon, d: 0 });
  s.push({ pts: [[-X, 0.02, 0], [-X, h, 0], [X, h, 0], [X, 0.02, 0]], col: ribbon, d: 0 });
  for (const sx of [-1, 1]) s.push({ pts: circle(0, 0, 0.16, 12).map(p => [sx * (0.16 + p[0]), h + 0.12 + p[1] * 0.75, 0]), col: ribbon, d: 0 });
  return s;
}
// A star, drawn twice at right angles so it reads from every side as it turns.
function star(R = 0.7, col = C.gold) {
  const pts = []; for (let i = 0; i <= 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * 0.4 : R; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  return [{ pts, col, d: 0 }, { pts: pts.map(([x, y]) => [x * 0.6, y * 0.6]), col: C.white, d: 0 },
    { pts: pts.map(([x, y]) => [0, y, x]), col, d: 0 }, { pts: pts.map(([x, y]) => [0, y * 0.6, x * 0.6]), col: C.white, d: 0 }];
}
function snowflake(R = 0.6) {
  const s = [];
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, c = Math.cos(a), sn = Math.sin(a), P = (r, t = 0) => [c * r - sn * t, sn * r + c * t];
    s.push({ pts: [[0, 0], P(R)], col: C.ice, d: 0 });
    for (const [r, l] of [[0.32, 0.16], [0.5, 0.1]]) s.push({ pts: [P(r + l, -l), P(r), P(r + l, l)], col: C.white, d: 0 });
  }
  s.push({ pts: circle(0, 0, 0.12, 6), col: C.white, d: 0 });
  return s;
}
// A banner with words on it, glowing (the sign over the way in).
function signBoard(w, h, lines, bg = '#0c1a2c', ink = '#fff3cf') {
  const t = canvasTex(1024, Math.round(1024 * h / w), (c, W, H) => {
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#d9b45a'; c.lineWidth = 10; c.strokeRect(14, 14, W - 28, H - 28);
    for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.5})`; c.beginPath(); c.arc(30 + Math.random() * (W - 60), 30 + Math.random() * (H - 60), 1 + Math.random() * 2.5, 0, TAU); c.fill(); }
    c.textAlign = 'center'; c.textBaseline = 'middle';
    lines.forEach(([txt, size, col, y]) => { c.fillStyle = col || ink; c.font = `700 ${size}px Georgia, 'Times New Roman', serif`; c.shadowColor = col || ink; c.shadowBlur = 18; c.fillText(txt, W / 2, H * y); });
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(1.5, 1.5, 1.5), side: THREE.DoubleSide }));
}

// ---------------------------------------------------------------- the feature
feature({
  id: 'butlerfield',
  secrets: [['wonderland', 'Winter Wonderland (the whole path)'], ['bigair', 'Big Air (clear the gap)'], ['homerun', 'Home run (round the bases)'], ['snowmen', 'Six snowmen down']],
  init(k) {
    this.k = k; const L = k.plan.lakefront; if (!L) return;
    this.F = L.field; this.t = 0;
    const g = this.g = new THREE.Group(); g.name = 'butlerfield'; k.group.add(g);
    this.bulbs = new Bulbs(); this.wire = new Wire(); this.anim = []; this.glow = [];
    const snowM = this.snowM = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, map: k.museum.snowTex, roughness: 0.95, emissiveMap: k.museum.snowTex, emissive: new THREE.Color(0.25, 0.3, 0.45), emissiveIntensity: 0.5 });
    this._lightShow(k);
    this._jumpPark(k, snowM);
    this._diamonds(k);
    this._paths(k);
    this._glows(g);
    this.bulbs.build(g);
    const wm = this.wire.mesh(); if (wm) g.add(wm);
  },

  // ============================================================ the light show
  _lightShow(k) {
    const O = k.plan.obstacles, B = this.bulbs, W = this.wire, g = this.g;
    // The path: a smooth curve through these points, from the arch by the cross path to the tree at the north end.
    const ctrl = [[311, 104], [318, 97], [334, 95], [352, 95], [368, 94], [377, 87], [377, 77], [367, 70], [350, 70], [334, 70], [320, 70], [311, 63], [313, 51], [324, 44], [340, 44], [356, 44], [367, 43], [377, 35], [376, 23], [365, 17], [350, 18], [334, 18], [322, 17], [312, 9], [316, -2], [327, -7], [343, -8]];
    const curve = new THREE.CatmullRomCurve3(ctrl.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
    const len = curve.getLength(), N = Math.ceil(len / 0.5), P = [];
    for (let i = 0; i <= N; i++) { const p = curve.getPointAt(i / N), t = curve.getTangentAt(i / N); P.push({ x: p.x, z: p.z, tx: t.x, tz: t.z, nx: -t.z, nz: t.x, s: len * i / N }); }
    this.path = P; this.len = len;
    const at = s => P[Math.max(0, Math.min(P.length - 1, Math.round(s / len * N)))];
    const sAt = (x, z) => { let b = 0, bd = 1e9; for (const p of P) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; b = p.s; } } return b; };
    const HW = 1.6;
    // the path itself: packed snow, a little lighter than the lawn, with the light of the bulbs on it
    {
      const pos = [], uv = [], idx = [];
      P.forEach((p, i) => { for (const sd of [-1, 1]) { pos.push(p.x + p.nx * HW * sd, 0.03, p.z + p.nz * HW * sd); uv.push(p.s / 3, sd < 0 ? 0 : 1); } if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } });
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      const tex = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#c9d4e2'; c.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(${150 + Math.random() * 60},${160 + Math.random() * 60},${185 + Math.random() * 50},.35)`; c.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 7, 1 + Math.random() * 3); }
        const e = c.createLinearGradient(0, 0, 0, h); e.addColorStop(0, 'rgba(255,255,255,.55)'); e.addColorStop(0.12, 'rgba(255,255,255,0)'); e.addColorStop(0.88, 'rgba(255,255,255,0)'); e.addColorStop(1, 'rgba(255,255,255,.55)'); c.fillStyle = e; c.fillRect(0, 0, w, h); });
      tex.wrapS = THREE.RepeatWrapping;
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, emissive: new THREE.Color(0.35, 0.3, 0.35), emissiveMap: tex, emissiveIntensity: 0.55, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      m.receiveShadow = true; g.add(m);
    }
    // bulbs along both edges, on short stakes in the snow, warm white and coloured by turns
    const EDGE = [C.warm, C.red, C.warm, C.green, C.warm, C.blue, C.warm, C.gold];
    for (let s = 0; s < len; s += 5) { const p = at(s); this.glow.push([p.x, p.z, 3.0, [2.4, 2.0, 1.6], 0.07]); }
    for (let s = 0, i = 0; s < len; s += 0.7, i++) { const p = at(s); for (const sd of [-1, 1]) B.add(p.x + p.nx * (HW + 0.15) * sd, 0.22, p.z + p.nz * (HW + 0.15) * sd, EDGE[i % EDGE.length], Math.random(), 0, 0.07); }
    // tunnels of arches: each arch a half-ellipse of bulbs over the path, the light running down the tunnel
    const tunnel = (s0, s1, cols, mode, gap = 0.9, chaseRate = 0.55) => {
      let j = 0;
      for (let s = s0; s <= s1; s += gap, j++) {
        const p = at(s), n = 15;
        for (let i = 0; i <= n; i++) {
          const a = Math.PI * i / n, ox = Math.cos(a) * 2.05, oy = Math.sin(a) * 2.9;
          B.add(p.x + p.nx * ox, oy + 0.05, p.z + p.nz * ox, cols[(j + (i % 2)) % cols.length], mode === 1 ? j * chaseRate : Math.random(), mode, 0.08);
        }
        W.stroke(Array.from({ length: 13 }, (_, i) => { const a = Math.PI * i / 12, ox = Math.cos(a) * 2.05; return [p.x + p.nx * ox, Math.sin(a) * 2.9, p.z + p.nz * ox]; }), [0.18, 0.2, 0.24], null, 0.018);
        if (j % 3 === 0) this.glow.push([p.x, p.z, 3.4, cols[0], 0.2]);
        for (const sd of [-1, 1]) O.push({ x0: p.x + p.nx * 2.05 * sd - 0.05, x1: p.x + p.nx * 2.05 * sd + 0.05, z0: p.z + p.nz * 2.05 * sd - 0.05, z1: p.z + p.nz * 2.05 * sd + 0.05, y0: 0, y1: 2.6 });
      }
      return { s0, s1 };
    };
    const t1 = [sAt(327, 95), sAt(362, 94)].sort((a, b) => a - b), t2 = [sAt(329, 44), sAt(362, 44)].sort((a, b) => a - b), t3 = [sAt(361, 18), sAt(328, 18)].sort((a, b) => a - b);
    tunnel(t1[0], t1[1], [C.warm, C.gold, C.warm], 1);
    this.carolTunnel = tunnel(t2[0], t2[1], [C.red, C.white], 0, 1.0);
    tunnel(t3[0], t3[1], [C.ice, C.blue, C.white], 1, 0.9, -0.55);
    this.tunnels = [t1, t2, t3];
    // the way in: a great arch of three rows of bulbs, posts wrapped in light, and the sign under it
    {
      const p = at(1.5), span = 3.4, H = 4.4;
      for (let r = 0; r < 3; r++) for (let i = 0; i <= 34; i++) { const a = Math.PI * i / 34, ox = Math.cos(a) * (span + r * 0.22), oy = Math.sin(a) * (H + r * 0.22); B.add(p.x + p.nx * ox, oy, p.z + p.nz * ox, [C.gold, C.red, C.green][r], i * 0.18, 1, 0.08); }
      for (const sd of [-1, 1]) { const x = p.x + p.nx * span * sd, z = p.z + p.nz * span * sd; for (let y = 0; y < 1; y += 0.07) B.add(x + Math.cos(y * 40) * 0.12, y * 2.2, z + Math.sin(y * 40) * 0.12, y * 10 % 2 < 1 ? C.red : C.white, y * 3, 2, 0.05); O.push({ x0: x - 0.15, x1: x + 0.15, z0: z - 0.15, z1: z + 0.15, y0: 0, y1: 4 }); }
      this.glow.push([p.x, p.z, 6, C.gold, 0.2]);
      const sign = signBoard(4.2, 1.15, [['WINTER WONDERLAND', 104, '#fff1c8', 0.42], ['THE LIGHTS ON BUTLER FIELD', 40, '#ffb3a8', 0.76]]);
      sign.position.set(p.x, 3.1, p.z); sign.rotation.y = Math.atan2(-p.tx, -p.tz); g.add(sign);      // facing whoever comes up the path
    }
    // Placing a figure: at distance s along the path, `off` metres to its left (negative: right), facing the path.
    const place = (s, off, strokes, depth = 0.15, scale = 1, o = 0.5) => {
      const p = at(s), x = p.x + p.nx * off, z = p.z + p.nz * off, yaw = Math.atan2(-p.nx * Math.sign(off), -p.nz * Math.sign(off));
      const M = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), new THREE.Vector3(scale, scale, scale));
      if (strokes) { W.frame(strokes, depth, M); this.glow.push([x, z, 1.3 * scale, strokes[0].col, 0.16]); }
      if (o) O.push({ x0: x - o * scale, x1: x + o * scale, z0: z - o * scale, z1: z + o * scale, y0: 0, y1: 1.2 * scale });
      return { x, z, yaw, M, p };
    };
    // A figure of its own, to animate: its strokes in its own mesh, under a group set where it stands.
    const own = (strokes, depth, x, y, z, yaw, scale = 1) => { const w = new Wire(); w.frame(strokes, depth, null); const m = w.mesh(); const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = yaw; grp.scale.setScalar(scale); if (m) grp.add(m); g.add(grp); return grp; };

    // --- candy canes along the first bend and round the entrance
    for (let s = 6; s < t1[0] - 1; s += 3) for (const sd of [-1, 1]) place(s, sd * 3.6, candyCane(), 0.05, 1.1, 0.15);
    const bend1 = [sAt(377, 87), sAt(367, 70)];
    for (let s = bend1[0] - 4; s < bend1[1] + 2; s += 3.2) place(s, -3.8, candyCane(), 0.05, 1.25, 0.15);
    // --- giant ornaments inside the first bend
    [[C.red, 0], [C.gold, 4.5], [C.blue, 9]].forEach(([c, ds]) => place(bend1[0] + ds, 4.6, ornament(c, 0.8), 0, 1, 0.8));
    // --- Santa and his team, flying, on the north side of the second straight; reindeer grazing on the south
    {
      const s = sAt(345, 70), p = at(s), off = 5.2;      // north of the path (left or right as the path runs)
      const side = p.nz * off > 0 ? -1 : 1;              // whichever side puts it to the north (smaller z)
      const base = place(s, side * off, null, 0, 1, 0);
      // sleigh and team in one frame: the team ahead of the sleigh, along its own +x
      const grp = new THREE.Group(); grp.position.set(base.x, 0.6, base.z); grp.rotation.y = base.yaw; grp.scale.setScalar(1.5); g.add(grp);
      const sw = new Wire(); sw.frame(sleigh(), 0, null); const sm = sw.mesh(); if (sm) grp.add(sm);
      const deer = [];
      for (let i = 0; i < 2; i++) {
        const a = new Wire(), b = new Wire(); a.frame(deerBody('leap'), 0, null); b.frame(deerBody('stand'), 0, null);
        const head = new Wire(); head.frame(deerHead(C.warm, i === 1), 0, null);
        const d = new THREE.Group(); d.position.set(2.5 + i * 1.9, 0.3 + i * 0.2, 0); const ma = a.mesh(), mb = b.mesh(), hd = head.mesh(); const hg = new THREE.Group(); hg.position.set(1.22, 1.28, 0); hg.add(hd); d.add(ma, mb, hg); mb.visible = false; grp.add(d);
        deer.push({ d, a: ma, b: mb, i });
        // reins from Santa's hand to the harness
        sw.stroke([[1.3, 1.28, 0], [2.5 + i * 1.9 + 1.0, 1.25 + i * 0.2, 0]], C.gold, null, 0.012);
      }
      const reins = sw.mesh(); if (reins) grp.add(reins);
      this.anim.push({ kind: 'sleigh', grp, deer, y0: 0.6 }); this.glow.push([base.x, base.z, 6, C.gold, 0.18], [base.x, base.z, 3, C.red, 0.16]);
      O.push({ x0: base.x - 1.6, x1: base.x + 1.6, z0: base.z - 1.6, z1: base.z + 1.6, y0: 0, y1: 1.5 });
      // three standing reindeer across the path, heads bobbing as they graze
      for (let i = 0; i < 3; i++) {
        const ps = s - 10 + i * 7, q = place(ps, -side * 5.0, deerBody('stand'), 0, 1.35, 0.7);
        const hw = new Wire(); hw.frame(deerHead(C.warm), 0, null); const hm = hw.mesh(); const hg = new THREE.Group(); hg.add(hm);
        const pivot = new THREE.Vector3(1.22, 1.28, 0).applyMatrix4(q.M); hg.position.copy(pivot); hg.rotation.y = q.yaw; hg.scale.setScalar(1.35); g.add(hg);
        this.anim.push({ kind: 'graze', head: hg, ph: i * 1.7 });
      }
    }
    // --- snowflakes hung over the second straight from gantries of light
    {
      const sA = sAt(366, 70), sB = sAt(322, 70);
      for (let s = Math.min(sA, sB) + 3; s < Math.max(sA, sB) - 2; s += 8) {
        if (Math.abs(s - sAt(345, 70)) < 3) continue;
        const p = at(s), span = 2.8, H = 4.6;
        for (const sd of [-1, 1]) { const x = p.x + p.nx * span * sd, z = p.z + p.nz * span * sd; W.stroke([[x, 0, z], [x, H, z]], [0.25, 0.28, 0.32], null, 0.04); for (let y = 0.3; y < H; y += 0.35) B.add(x, y, z, C.ice, y * 0.4, 1, 0.045); O.push({ x0: x - 0.07, x1: x + 0.07, z0: z - 0.07, z1: z + 0.07, y0: 0, y1: H }); }
        for (let i = 0; i <= 16; i++) { const t = i / 16, ox = (t * 2 - 1) * span, sag = Math.sin(t * Math.PI) * 0.35; B.add(p.x + p.nx * ox, H - sag, p.z + p.nz * ox, i % 2 ? C.white : C.ice, i * 0.3, 0, 0.05); }
        const f = own(snowflake(0.7), 0, p.x, H - 1.2, p.z, Math.atan2(p.tx, p.tz));
        this.anim.push({ kind: 'spin', grp: f, rate: 0.35 + Math.random() * 0.3, axis: 'z' });
      }
    }
    // --- the North Pole between the second and third straights: penguins, and two polar bears
    {
      const pz = 57; this.glow.push([336, 57, 7, C.blue, 0.14], [356, 57, 6, C.ice, 0.14]);
      for (let i = 0; i < 7; i++) {
        const x = 327 + i * 3.1, z = pz + (i % 2) * 1.6 - 0.8, sc = (i === 3 ? 1.25 : 0.75 + (i % 3) * 0.12) * 1.4;
        const yaw = (i % 2 ? 0.25 : -0.25) + (z > pz ? 0 : Math.PI);
        const M = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), new THREE.Vector3(sc, sc, sc));
        W.frame(penguin(), 0, M); O.push({ x0: x - 0.4, x1: x + 0.4, z0: z - 0.3, z1: z + 0.3, y0: 0, y1: 1.3 });
      }
      for (const [x, z, yaw, sc] of [[352, 56, 0.3, 1.7], [361, 58.5, Math.PI + 0.4, 1.3]]) {
        const M = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), new THREE.Vector3(sc, sc, sc));
        W.frame(polarBear(), 0, M); O.push({ x0: x - 1, x1: x + 1, z0: z - 1, z1: z + 1, y0: 0, y1: 1.1 });
      }
      // ice blocks, outlined in pale blue
      for (const [x, z, w2] of [[341, 60, 1.2], [343, 54.5, 0.9], [366, 56, 1.1]]) { const M = new THREE.Matrix4().makeTranslation(x, 0, z); W.frame(present(w2, w2 * 0.8, w2, C.ice, C.ice), 0, M); }
    }
    // --- presents and the snowman family between the third and fourth straights
    {
      this.glow.push([337, 31, 6, C.white, 0.12], [353, 30, 5, C.pink, 0.14]);
      [[0, 1.15, C.red], [6, 0.9, C.green], [11, 1.3, C.purple]].forEach(([dx, sc, sf], i) => {
        const x = 331 + dx, z = 31 + (i % 2) * 1.2, M = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), i === 1 ? Math.PI : 0), new THREE.Vector3(1, 1, 1));
        W.frame(snowman(sc, sf), 0, M); O.push({ x0: x - 0.45 * sc, x1: x + 0.45 * sc, z0: z - 0.45 * sc, z1: z + 0.45 * sc, y0: 0, y1: 2 * sc });
      });
      const boxes = [[349, 29, 1.2, 0.9, 1.0, C.green, C.red], [351, 31.5, 0.9, 1.1, 0.9, C.blue, C.gold], [353.5, 29.5, 1.4, 0.7, 1.1, C.red, C.white], [352, 27, 0.7, 0.6, 0.7, C.gold, C.green], [356, 32, 1.0, 1.4, 1.0, C.pink, C.white], [358, 28.5, 1.2, 0.8, 1.2, C.purple, C.gold]];
      for (const [x, z, w2, h, d, c1, c2] of boxes) { const M = new THREE.Matrix4().makeRotationY((x * 7 + z) % 1.2).setPosition(x, 0, z); W.frame(present(w2, h, d, c1, c2), 0, M); O.push({ x0: x - w2 / 2, x1: x + w2 / 2, z0: z - d / 2, z1: z + d / 2, y0: 0, y1: h }); }
    }
    // --- stars on poles round the third bend, and along the last straight; turning slowly
    {
      const sb = [sAt(377, 35), sAt(365, 17)];
      for (let s = sb[0] - 3; s < sb[1] + 3; s += 4.5) { const p = place(s, -4.2, null, 0, 1, 0); W.stroke([[p.x, 0, p.z], [p.x, 2.4, p.z]], [0.3, 0.32, 0.36], null, 0.03); const f = own(star(0.6, C.gold), 0, p.x, 3.0, p.z, p.yaw); this.anim.push({ kind: 'spin', grp: f, rate: 0.6, axis: 'y' }); O.push({ x0: p.x - 0.08, x1: p.x + 0.08, z0: p.z - 0.08, z1: p.z + 0.08, y0: 0, y1: 2.5 }); }
      // more giant ornaments under the last straight, coloured by turns
      [C.green, C.red, C.gold, C.blue, C.purple].forEach((c, i) => { const x = 322 + i * 9, z = 5 + (i % 2) * 2; const M = new THREE.Matrix4().makeTranslation(x, 0, z); W.frame(ornament(c, 0.7 + (i % 2) * 0.25), 0, M); O.push({ x0: x - 0.8, x1: x + 0.8, z0: z - 0.8, z1: z + 0.8, y0: 0, y1: 1.6 }); });
    }
    // --- the tree at the end: a spiral of lights 11 m high running up to a star, presents round its foot
    {
      const tx = 353, tz = -9.5, H = 14, R = 5, turns = 12;
      for (let i = 0; i < 900; i++) { const t = i / 900, a = t * turns * TAU, r = R * (1 - t) + 0.15, y = 0.3 + t * H; B.add(tx + Math.cos(a) * r, y, tz + Math.sin(a) * r, [C.gold, C.red, C.green, C.blue, C.white][i % 5], t * turns * 3.4, i % 3 ? 1 : 0, 0.11); }
      for (let i = 0; i < 12; i++) { const a = i * TAU / 12; W.stroke([[tx + Math.cos(a) * (R + 0.15), 0.3, tz + Math.sin(a) * (R + 0.15)], [tx + Math.cos(a) * 0.2, H + 0.2, tz + Math.sin(a) * 0.2]], [0.3, 1.3, 0.45], null, 0.03); }
      const st = own(star(1.5, C.gold), 0, tx, H + 1.3, tz, 0); this.anim.push({ kind: 'spin', grp: st, rate: 0.4, axis: 'y' });
      for (let i = 0; i < 18; i++) { const a = i * TAU / 18; B.add(tx + Math.cos(a) * (R + 1.4), 0.15, tz + Math.sin(a) * (R + 1.4), C.warm, i / 18, 2, 0.07); }
      [[-3.8, 3.5, C.red, C.gold], [3.6, 3.2, C.blue, C.white], [0.5, 4.8, C.green, C.red], [-4.6, -1, C.gold, C.green]].forEach(([dx, dz, c1, c2]) => { const M = new THREE.Matrix4().makeRotationY(dx).setPosition(tx + dx, 0, tz + dz); W.frame(present(1.0, 0.8, 1.0, c1, c2), 0, M); });
      O.push({ x0: tx - 3.2, x1: tx + 3.2, z0: tz - 3.2, z1: tz + 3.2, y0: 0, y1: H });
      this.glow.push([tx, tz, 11, C.gold, 0.22], [tx - 3, tz + 3, 5, C.red, 0.16], [tx + 3, tz + 3, 5, C.green, 0.16], [tx, tz - 4, 5, C.blue, 0.14]);
      this.tree = { x: tx, z: tz };
    }
    // the checkpoints the whole-path secret is counted by
    this.checks = []; for (let s = 0; s <= len; s += len / 30) this.checks.push(at(s)); this.checks.push(at(len)); this.ci = 0;
  },

  // Light thrown on the snow: soft coloured pools under the tunnels, round the figures and the tree. One instanced mesh.
  _glows(g) {
    const n = this.glow.length; if (!n) return;
    const tex = canvasTex(64, 64, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), n);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2), col = new THREE.Color();
    this.glow.forEach(([x, z, r, c, k], i) => { m.setMatrixAt(i, M.compose(new THREE.Vector3(x, 0.05, z), Q, new THREE.Vector3(r * 2, r * 2, 1))); m.setColorAt(i, col.setRGB(c[0] * k, c[1] * k, c[2] * k)); });
    m.frustumCulled = false; m.renderOrder = 5; g.add(m);
  },

  // ============================================================ the jump park
  // The ploughs pile the snow from Columbus Drive here: a mountain to climb, a kicker over a gap, a long table-top with a
  // lip, a run of rollers, and a quarter pipe at the end of it all. Real surfaces: the car leaves the ground off them.
  _jumpPark(k, snowM) {
    const S = k.plan.surfaces, g = this.g;
    const B0 = this.bulbs, edgeCol = [C.orange, C.blue, C.gold, C.ice];
    // each piece of snow, drawn, with lights along both its long edges so the lines read at night
    const add = s => {
      S.push({ skin: 'snow', thick: 0, ...s }); const q = S[S.length - 1]; g.add(this._snowMesh(q, snowM));
      const col = edgeCol[S.length % edgeCol.length];
      for (let x = q.x0 + 0.3; x < q.x1; x += 0.8) for (const z of [q.z0 + 0.12, q.z1 - 0.12]) B0.add(x, heightOf(q, x, z) + 0.09, z, col, x * 0.3, 2, 0.085);
      if (q.axis === null || q.h1 > 1.5 || q.h0 > 1.5) this.glow.push([(q.x0 + q.x1) / 2, (q.z0 + q.z1) / 2, Math.max(q.x1 - q.x0, q.z1 - q.z0) * 0.8, col, 0.1]);
      return q;
    };
    const z0 = 13, z1 = 21;
    // line one, west to east: a long run-up from the path, a kicker, a gap, a landing
    this.kick = add({ x0: 412, x1: 417, z0, z1, axis: 'x', h0: 0, h1: 1.7 });
    add({ x0: 417, x1: 418.2, z0, z1, axis: null, h0: 1.7, h1: 1.7 });
    this.land = add({ x0: 421.5, x1: 431, z0, z1, axis: 'x', h0: 1.6, h1: 0 });
    this.gap = { x0: 418.2, x1: 421.5, z0, z1 };
    // the table-top: up, a long top, a lip on the end, and a landing beyond
    add({ x0: 436, x1: 443, z0, z1, axis: 'x', h0: 0, h1: 2.0, ease: true });
    add({ x0: 443, x1: 451, z0, z1, axis: null, h0: 2.0, h1: 2.0 });
    add({ x0: 451, x1: 453, z0, z1, axis: 'x', h0: 2.0, h1: 2.5 });
    add({ x0: 457.5, x1: 466, z0, z1, axis: 'x', h0: 2.2, h1: 0 });
    // rollers: a run of humps to pump over, and the quarter pipe at the end of them, with a deck to stand on
    for (let i = 0; i < 6; i++) { const x = 396 + i * 7; add({ x0: x, x1: x + 3, z0: 34, z1: 41, axis: 'x', h0: 0, h1: 0.8, ease: true }); add({ x0: x + 3, x1: x + 6, z0: 34, z1: 41, axis: 'x', h0: 0.8, h1: 0, ease: true }); }
    add({ x0: 448, x1: 453, z0: 31, z1: 44, axis: 'x', h0: 0, h1: 3.0, curve: 5.67 });
    add({ x0: 453, x1: 455.5, z0: 31, z1: 44, axis: null, h0: 3.0, h1: 3.0 });
    // the mountain the ploughs left, with a kicker of packed snow on its top
    { const s = { skin: 'hill', hill: true, axis: 'hill', cx: 440, cz: -6, rx: 15, rz: 10, H: 5.5, bump: 0.9, br: 2.6, x0: 425, x1: 455, z0: -16, z1: 4, h0: 0, h1: 5.5, thick: 0 }; S.push(s); if (k.plan.hills) k.plan.hills.push(s); g.add(this._snowMesh(s, snowM, 1)); }
    // marker poles and a painted sign, so the lines read from a distance
    const B = this.bulbs;
    for (const [x, z] of [[412, z0 - 0.6], [412, z1 + 0.6], [418.2, z0 - 0.6], [418.2, z1 + 0.6], [421.5, z0 - 0.6], [421.5, z1 + 0.6], [453, z0 - 0.6], [453, z1 + 0.6], [457.5, z0 - 0.6], [457.5, z1 + 0.6]]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 6), lit(0xd23a2a)); pole.position.set(x, 0.9, z); g.add(pole);
      B.add(x, 1.85, z, C.orange, Math.random(), 2, 0.07);
    }
    const sign = signBoard(3.2, 1.0, [['PLOUGH PILE PARK', 76, '#ffe1a0', 0.4], ['clear the gap · ride the pipe', 34, '#bfe3ff', 0.75]], '#1b1208');
    const th = -Math.PI / 2 + 0.6; sign.position.set(393, 2.0, 9.5); sign.rotation.y = th; g.add(sign);
    for (const dx of [-1.5, 1.5]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), lit(0x3a2a1a)); post.position.set(393 + Math.cos(th) * dx, 1.3, 9.5 - Math.sin(th) * dx); g.add(post); }
    k.plan.obstacles.push({ x0: 392.6, x1: 393.4, z0: 8.4, z1: 10.6, y0: 0, y1: 2.6 });
  },
  // A sheet of snow over a surface, following its height (a hill, a slope, a skate ramp), with sides down to the ground.
  _snowMesh(s, mat, bumpy = 0) {
    const nx = Math.max(2, Math.min(64, Math.ceil((s.x1 - s.x0) / 0.5))), nz = Math.max(2, Math.min(64, Math.ceil((s.z1 - s.z0) / 0.5)));
    const pos = [], uv = [], idx = [];
    const H = (x, z) => heightOf(s, x, z) + (bumpy ? Math.max(0, Math.sin(x * 1.7) * Math.cos(z * 1.3) * 0.08 * Math.min(1, heightOf(s, x, z))) : 0);
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const x = s.x0 + (s.x1 - s.x0) * i / nx, z = s.z0 + (s.z1 - s.z0) * j / nz; pos.push(x, H(x, z) + 0.01, z); uv.push(x / 4, z / 4); }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    if (!s.hill) {
      // sides: down from each edge to the ground
      const edge = (pts) => { const base = pos.length / 3; pts.forEach(([x, z]) => { pos.push(x, H(x, z) + 0.01, z, x, 0, z); uv.push(x / 4, H(x, z) / 4, x / 4, 0); }); for (let i = 0; i < pts.length - 1; i++) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); } };
      const xs = Array.from({ length: nx + 1 }, (_, i) => s.x0 + (s.x1 - s.x0) * i / nx), zs = Array.from({ length: nz + 1 }, (_, j) => s.z0 + (s.z1 - s.z0) * j / nz);
      edge(xs.map(x => [x, s.z0])); edge(xs.map(x => [x, s.z1]).reverse()); edge(zs.map(z => [s.x0, z]).reverse()); edge(zs.map(z => [s.x1, z]));
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; m.matrixAutoUpdate = false; return m;
  },

  // ============================================================ the softball diamonds
  // Four diamonds in the south-east quarter, home plates in the corners, foul lines along the field's own lines.
  _diamonds(k) {
    const O = k.plan.obstacles, g = this.g, B = this.bulbs;
    const BL = 12, posts = [], panels = [], fenceGeo = [], benchGeo = [];
    const chain = canvasTex(64, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(200,210,220,.95)'; c.lineWidth = 2; for (let i = -64; i < 128; i += 16) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 64, 64); c.stroke(); c.beginPath(); c.moveTo(i + 64, 0); c.lineTo(i, 64); c.stroke(); } });
    chain.wrapS = chain.wrapT = THREE.RepeatWrapping;
    const meshM = new THREE.MeshStandardMaterial({ map: chain, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.4, emissive: 0x3a4250, emissiveMap: chain, emissiveIntensity: 0.6 });
    const steel = lit(0x8c949c, { metalness: 0.7, roughness: 0.35 }), plank = lit(0x6b4a2a), snowy = lit(0xe8eef6, { roughness: 0.9 }), yellow = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.9, 0.3) });
    const panel = (ax, az, bx, bz, h, y0 = 0) => {          // a chain-link panel between two points, with posts and a top rail
      const l = Math.hypot(bx - ax, bz - az), q = new THREE.PlaneGeometry(l, h); const uv = q.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * l / 0.6, uv.getY(i) * h / 0.6);
      q.rotateY(-Math.atan2(bz - az, bx - ax)); q.translate((ax + bx) / 2, y0 + h / 2, (az + bz) / 2); panels.push(q);
      for (const [x, z] of [[ax, az], [bx, bz]]) { const p = new THREE.CylinderGeometry(0.035, 0.035, h + 0.1, 6); p.translate(x, y0 + (h + 0.1) / 2, z); posts.push(p); }
      const r = new THREE.CylinderGeometry(0.025, 0.025, l, 6); r.rotateZ(Math.PI / 2); r.rotateY(-Math.atan2(bz - az, bx - ax)); r.translate((ax + bx) / 2, y0 + h, (az + bz) / 2); posts.push(r);
    };
    this.diamonds = [];
    // home plate, and which way the first-base line and the third-base line run (unit vectors along x and z)
    for (const [hx, hz, fx, tz, n] of [[395, 116, 1, 1, 1], [466, 116, -1, 1, 2], [395, 236, 1, -1, 3], [466, 236, -1, -1, 4]]) {
      const home = { x: hx, z: hz }, first = { x: hx + fx * BL, z: hz }, second = { x: hx + fx * BL, z: hz + tz * BL }, third = { x: hx, z: hz + tz * BL };
      this.diamonds.push({ n, bases: [home, first, second, third], step: 0, t: 0 });
      // the backstop: an arc of tall panels behind home plate
      const ux = -fx * Math.SQRT1_2, uz = -tz * Math.SQRT1_2, R = 4.5, base = Math.atan2(uz, ux);
      let px = null, pz = null;
      for (let i = 0; i <= 6; i++) { const a = base - 1.25 + 2.5 * i / 6, x = hx + Math.cos(a) * R, z = hz + Math.sin(a) * R; if (px !== null) { panel(px, pz, x, z, 3.4); O.push({ x0: Math.min(px, x) - 0.06, x1: Math.max(px, x) + 0.06, z0: Math.min(pz, z) - 0.06, z1: Math.max(pz, z) + 0.06, y0: 0, y1: 3.5 }); } px = x; pz = z; }
      // short fence wings along each line, a little outside it, and a team bench behind each
      const wing = (ax, az, bx, bz) => { panel(ax, az, bx, bz, 1.2); O.push({ x0: Math.min(ax, bx) - 0.06, x1: Math.max(ax, bx) + 0.06, z0: Math.min(az, bz) - 0.06, z1: Math.max(az, bz) + 0.06, y0: 0, y1: 1.25 }); };
      wing(hx + fx * 2.5, hz - tz * 3, hx + fx * 12, hz - tz * 3);            // behind the first-base line
      wing(hx - fx * 3, hz + tz * 2.5, hx - fx * 3, hz + tz * 12);            // behind the third-base line
      for (const [bx, bz, along] of [[hx + fx * 7, hz - tz * 4.2, 'x'], [hx - fx * 4.2, hz + tz * 7, 'z']]) {
        const seat = along === 'x' ? new THREE.BoxGeometry(4, 0.08, 0.4) : new THREE.BoxGeometry(0.4, 0.08, 4); seat.translate(bx, 0.45, bz); benchGeo.push(seat);
        for (const d of [-1.6, 0, 1.6]) { const leg = new THREE.BoxGeometry(0.06, 0.45, 0.35); if (along === 'z') leg.rotateY(Math.PI / 2); leg.translate(bx + (along === 'x' ? d : 0), 0.22, bz + (along === 'z' ? d : 0)); benchGeo.push(leg); }
        const cap = along === 'x' ? new THREE.BoxGeometry(4.05, 0.06, 0.44) : new THREE.BoxGeometry(0.44, 0.06, 4.05); cap.translate(bx, 0.52, bz); fenceGeo.push(cap);
        O.push(along === 'x' ? { x0: bx - 2, x1: bx + 2, z0: bz - 0.2, z1: bz + 0.2, y0: 0, y1: 0.5 } : { x0: bx - 0.2, x1: bx + 0.2, z0: bz - 2, z1: bz + 2, y0: 0, y1: 0.5 });
      }
      // bases poking out of the snow, the plate, the pitcher's plate, the foul poles far down the lines
      for (const b of [first, second, third]) { const q = new THREE.BoxGeometry(0.38, 0.08, 0.38); q.rotateY(Math.PI / 4); q.translate(b.x, 0.04, b.z); fenceGeo.push(q); B.add(b.x, 0.12, b.z, C.white, Math.random(), 2, 0.03); }
      { const sh = new THREE.Shape([[-0.22, 0], [0.22, 0], [0.22, 0.22], [0, 0.44], [-0.22, 0.22]].map(([x, y]) => new THREE.Vector2(x, y))); const q = new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false }); q.rotateX(-Math.PI / 2); q.rotateY(Math.atan2(fx, tz) + Math.PI); q.translate(hx, 0.0, hz); fenceGeo.push(q); }
      { const q = new THREE.BoxGeometry(0.6, 0.05, 0.15); q.translate(hx + fx * BL * 0.5, 0.15, hz + tz * BL * 0.5); fenceGeo.push(q); const m = new THREE.SphereGeometry(1.6, 16, 6, 0, TAU, 0, 0.5); m.scale(1, 0.2, 1); m.translate(hx + fx * BL * 0.5, -0.05, hz + tz * BL * 0.5); fenceGeo.push(m); }
      for (const [x, z] of [[hx + fx * 26, hz], [hx, hz + tz * 26]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 7, 8), yellow); p.position.set(x, 3.5, z); g.add(p); O.push({ x0: x - 0.1, x1: x + 0.1, z0: z - 0.1, z1: z + 0.1, y0: 0, y1: 7 }); }
      // a number on the backstop
      { const t = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#123a24'; c.fillRect(0, 0, w, h); c.strokeStyle = '#f2e8c8'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#f2e8c8'; c.font = '700 64px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('F' + n, w / 2, h / 2 + 4); });
        const s = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(1.1, 1.1, 1.1), side: THREE.DoubleSide })); s.position.set(hx + ux * (R + 0.05), 2.4, hz + uz * (R + 0.05)); s.rotation.y = Math.atan2(ux, uz); g.add(s); }
    }
    g.add(new THREE.Mesh(mergeAll(panels), meshM), new THREE.Mesh(mergeAll(posts), steel), new THREE.Mesh(mergeAll(benchGeo), plank), new THREE.Mesh(mergeAll(fenceGeo), snowy));
    // snowmen standing about the diamonds like fielders: knock all six down
    this.snowmen = []; this.downed = 0;
    const smM = lit(0xf4f7fb, { roughness: 0.85 }), coal = lit(0x18181a), carrot = lit(0xe2702a), scarfM = lit(0xc0392b);
    for (const [x, z] of [[401, 122], [404, 129], [459, 125], [401, 228], [458, 229], [428, 140]]) {
      const grp = new THREE.Group(); grp.position.set(x, 0, z);
      [[0.42, 0.42], [0.3, 1.04], [0.21, 1.5]].forEach(([r, y]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), smM); m.position.y = y; grp.add(m); });
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.22, 8), carrot); nose.rotation.x = Math.PI / 2; nose.position.set(0, 1.5, 0.28); grp.add(nose);
      for (const sx of [-0.07, 0.07]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), coal); e.position.set(sx, 1.58, 0.19); grp.add(e); }
      const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 16), scarfM); scarf.rotation.x = Math.PI / 2; scarf.position.y = 1.3; grp.add(scarf);
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.24, 12), coal); hat.position.y = 1.78; grp.add(hat); const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 14), coal); brim.position.y = 1.66; grp.add(brim);
      grp.rotation.y = Math.atan2(395 - x + 30, 180 - z);
      g.add(grp);
      this.snowmen.push(k.pushable(grp, { r: 0.42, h: 1.8, tip: true, hit: 0.9, drag: 5, onTip: () => this._snowmanDown(k) }));
    }
  },
  _snowmanDown(k) {
    this.downed++; k.synth.noise(0.3, { vol: 0.06, lp: 900 });
    if (this.downed >= this.snowmen.length) { if (k.find('snowmen')) k.callout('SIX SNOWMEN DOWN'); }
    else k.say(`Snowman down. ${this.downed} of ${this.snowmen.length}.`, 2);
  },

  // ============================================================ along the paths
  // Park lamps down both sides of the paths, benches and bins between them, the field's sign, a warming hut and a scoreboard.
  _paths(k) {
    const O = k.plan.obstacles, g = this.g, B = this.bulbs, F = this.F;
    const lamps = [];
    for (let z = F.z0 + 12; z < F.z1 - 8; z += 22) lamps.push([z % 44 < 22 ? 384.6 : 389.4, z]);
    for (let x = F.x0 + 14; x < F.x1 - 6; x += 22) { if (Math.abs(x - 387) < 4) continue; lamps.push([x, x % 44 < 22 ? 107.6 : 112.4]); }
    for (let x = 334; x < 384; x += 22) lamps.push([x, 211.6]);
    const n = lamps.length;
    const postG = new THREE.CylinderGeometry(0.05, 0.07, 3.6, 8); postG.translate(0, 1.8, 0);
    const posts = new THREE.InstancedMesh(postG, lit(0x1c2126, { metalness: 0.5, roughness: 0.4 }), n);
    const globes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.3, 1.3) }), n);
    const poolT = canvasTex(64, 64, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: poolT, color: new THREE.Color(0.5, 0.36, 0.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), n);
    const M = new THREE.Matrix4(), I = new THREE.Quaternion(), Qf = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2), one = new THREE.Vector3(1, 1, 1);
    lamps.forEach(([x, z], i) => {
      posts.setMatrixAt(i, M.compose(new THREE.Vector3(x, 0, z), I, one)); globes.setMatrixAt(i, M.compose(new THREE.Vector3(x, 3.75, z), I, one)); pools.setMatrixAt(i, M.compose(new THREE.Vector3(x, 0.04, z), Qf, new THREE.Vector3(10, 10, 1)));
      O.push({ x0: x - 0.07, x1: x + 0.07, z0: z - 0.07, z1: z + 0.07, y0: 0, y1: 3.7 });
    });
    for (const m of [posts, globes, pools]) m.frustumCulled = false; pools.renderOrder = 4;
    g.add(posts, globes, pools);
    // benches and bins between the lamps
    const wood = [], iron = [], bins = [];
    lamps.forEach(([x, z], i) => {
      if (i % 2) return;
      const alongZ = Math.abs(x - 387) < 4, bx = alongZ ? x + (x < 387 ? -0.9 : 0.9) : x + 6, bz = alongZ ? z + 6 : z + (z < 110 ? -0.9 : 0.9);
      if (bx > 300 && bx < 384 && bz < 106 && bz > -20) return;        // not in the light show
      if (bx > 298 && bx < 332 && bz > 99 && bz < 118) return;           // nor in front of its way in
      for (let s = 0; s < 3; s++) { const q = alongZ ? new THREE.BoxGeometry(0.12, 0.04, 1.8) : new THREE.BoxGeometry(1.8, 0.04, 0.12); q.translate(bx + (alongZ ? (s - 1) * 0.14 : 0), 0.46, bz + (alongZ ? 0 : (s - 1) * 0.14)); wood.push(q); }
      for (let s = 0; s < 2; s++) { const q = alongZ ? new THREE.BoxGeometry(0.04, 0.4, 1.8) : new THREE.BoxGeometry(1.8, 0.4, 0.04); q.translate(bx + (alongZ ? (x < 387 ? -0.25 : 0.25) : 0), 0.75 + s * 0.0, bz + (alongZ ? 0 : (z < 110 ? -0.25 : 0.25))); wood.push(q); break; }
      for (const d of [-0.75, 0.75]) { const q = new THREE.BoxGeometry(0.05, 0.46, 0.4); if (!alongZ) q.rotateY(Math.PI / 2); q.translate(bx + (alongZ ? 0 : d), 0.23, bz + (alongZ ? d : 0)); iron.push(q); }
      O.push(alongZ ? { x0: bx - 0.3, x1: bx + 0.3, z0: bz - 0.9, z1: bz + 0.9, y0: 0, y1: 0.5 } : { x0: bx - 0.9, x1: bx + 0.9, z0: bz - 0.3, z1: bz + 0.3, y0: 0, y1: 0.5 });
      const cx = alongZ ? bx : bx + 1.4, cz = alongZ ? bz + 1.4 : bz; const b = new THREE.CylinderGeometry(0.24, 0.22, 0.85, 12, 1, true); b.translate(cx, 0.43, cz); bins.push(b); const lid = new THREE.CylinderGeometry(0.26, 0.26, 0.05, 12); lid.translate(cx, 0.86, cz); bins.push(lid);
      O.push({ x0: cx - 0.25, x1: cx + 0.25, z0: cz - 0.25, z1: cz + 0.25, y0: 0, y1: 0.9 });
    });
    if (wood.length) g.add(new THREE.Mesh(mergeAll(wood), lit(0x6b4a2a)));
    if (iron.length) g.add(new THREE.Mesh(mergeAll(iron), lit(0x1f2a24, { metalness: 0.5 })));
    if (bins.length) g.add(new THREE.Mesh(mergeAll(bins), lit(0x2a4a34, { metalness: 0.3, side: THREE.DoubleSide })));
    // the field's own sign, where the paths cross
    { const s = signBoard(2.6, 0.9, [['BUTLER FIELD', 92, '#f4ecd0', 0.42], ['GRANT PARK', 40, '#b9d9b0', 0.76]], '#12301e'); s.position.set(391.5, 1.5, 106); s.rotation.y = Math.PI / 4; g.add(s);
      for (const d of [-1.1, 1.1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2, 6), lit(0x1c2126)); p.position.set(391.5 + d * 0.707, 1.0, 106 - d * 0.707); g.add(p); } O.push({ x0: 390.5, x1: 392.5, z0: 105, z1: 107, y0: 0, y1: 2 }); }
    // the warming hut between the two southern diamonds: boards, a lit window, a stovepipe, and lights under its eaves
    {
      const hx = 430.5, hz = 238, hut = new THREE.Group(); hut.position.set(hx, 0, hz); g.add(hut);
      const boards = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#5a3a24'; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { c.fillStyle = `rgba(0,0,0,${0.2 + Math.random() * 0.15})`; c.fillRect(x, 0, 2, h); c.fillStyle = `rgba(255,220,180,${Math.random() * 0.08})`; c.fillRect(x + 2, 0, 14, h); } });
      boards.wrapS = boards.wrapT = THREE.RepeatWrapping; boards.repeat.set(2, 1);
      const bm = new THREE.MeshStandardMaterial({ map: boards, roughness: 0.85, emissive: 0xffffff, emissiveMap: boards, emissiveIntensity: 0.22 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(5, 2.6, 3.4), bm); body.position.y = 1.3; hut.add(body);
      const roofG = new THREE.BufferGeometry().setFromPoints([[-2.8, 2.6, -1.95], [2.8, 2.6, -1.95], [0, 3.6, -1.95], [-2.8, 2.6, 1.95], [2.8, 2.6, 1.95], [0, 3.6, 1.95]].map(p => new THREE.Vector3(...p).applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)));
      roofG.setIndex([0, 2, 1, 3, 4, 5, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 4]); roofG.computeVertexNormals(); hut.add(new THREE.Mesh(roofG, lit(0xeef3f8, { side: THREE.DoubleSide })));
      const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.6, 0.7) })); win.position.set(0.9, 1.5, -1.71); win.rotation.y = Math.PI; hut.add(win);
      const door = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.9), lit(0x3a2414)); door.position.set(-1.2, 0.95, -1.71); door.rotation.y = Math.PI; hut.add(door);
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8), lit(0x2a2a2a)); pipe.position.set(1.4, 3.6, 0.6); hut.add(pipe);
      for (let i = 0; i <= 26; i++) { const t = i / 26, x = hx - 2.8 + t * 5.6, sag = Math.sin(t * Math.PI * 4) * 0.06; B.add(x, 2.55 - Math.abs(sag), hz - 1.95, [C.red, C.green, C.gold, C.blue][i % 4], i * 0.4, 0, 0.06); }
      const sign = signBoard(2.2, 0.55, [['WARMING HUT', 70, '#ffe7b8', 0.55]], '#2a1408'); sign.position.set(hx, 2.95, hz - 1.97); sign.rotation.y = Math.PI; g.add(sign);
      O.push({ x0: hx - 2.5, x1: hx + 2.5, z0: hz - 1.7, z1: hz + 1.7, y0: 0, y1: 3.6 });
    }
    // the scoreboard between the two northern diamonds, facing south, lit
    {
      const sx = 430.5, sz = 114.5;
      const t = canvasTex(512, 256, (c, w, h) => {
        c.fillStyle = '#0d1f16'; c.fillRect(0, 0, w, h); c.strokeStyle = '#e8d9a8'; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16);
        c.fillStyle = '#e8d9a8'; c.font = '700 34px system-ui,sans-serif'; c.textAlign = 'center'; c.fillText('BUTLER FIELD', w / 2, 52);
        c.font = '600 26px system-ui,sans-serif'; c.fillText('HOME', w * 0.28, 104); c.fillText('GUEST', w * 0.72, 104);
        c.fillStyle = '#ffb02e'; c.font = '700 84px monospace'; c.fillText('0', w * 0.28, 190); c.fillText('0', w * 0.72, 190);
        c.fillStyle = '#e8d9a8'; c.font = '600 22px system-ui,sans-serif'; c.fillText('INNING  9   ·   SNOW DELAY', w / 2, 236);
      });
      const board = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.1), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(1.3, 1.3, 1.3), side: THREE.DoubleSide })); board.position.set(sx, 3.4, sz); g.add(board);
      const back = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.3, 0.15), lit(0x14261c)); back.position.set(sx, 3.4, sz - 0.1); g.add(back);
      for (const d of [-1.6, 1.6]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.3, 8), lit(0x1c2126)); p.position.set(sx + d, 1.15, sz - 0.1); g.add(p); O.push({ x0: sx + d - 0.1, x1: sx + d + 0.1, z0: sz - 0.2, z1: sz, y0: 0, y1: 4.6 }); }
      for (let i = 0; i < 14; i++) B.add(sx - 2.1 + i * 0.32, 4.6, sz + 0.05, C.warm, i * 0.5, 1, 0.05);
    }
  },

  // ============================================================ play
  // Drawn while the toy is within a few hundred metres (it shows from Columbus Drive, the Modern Wing and the harbour);
  // run while it is in or beside the field.
  active(k) {
    const p = k.pos, F = this.F; if (!F) return false;
    const far = Math.hypot(p.x - (F.x0 + F.x1) / 2, p.z - (F.z0 + F.z1) / 2); this.g.visible = far < 290;
    return p.x > F.x0 - 60 && p.x < F.x1 + 30 && p.z > F.z0 - 40 && p.z < F.z1 + 40;
  },
  update(dt, k) {
    this.t += dt; if (this.bulbs.u) this.bulbs.u.uT.value = this.t;
    const T = this.t, p = k.pos, v = k.v;
    for (const a of this.anim) {
      if (a.kind === 'spin') { if (a.axis === 'y') a.grp.rotation.y += a.rate * dt; else a.grp.rotation.z += a.rate * dt; }
      else if (a.kind === 'graze') { a.head.rotation.z = -0.25 - 0.35 * (0.5 + 0.5 * Math.sin(T * 0.9 + a.ph)); }
      else if (a.kind === 'sleigh') {
        a.grp.position.y = a.y0 + Math.sin(T * 1.2) * 0.18;
        const frame = Math.floor(T * 2.2) % 2;               // the light display's own two-frame leap
        for (const d of a.deer) { const f = (frame + d.i) % 2; d.a.visible = f === 0; d.b.visible = f === 1; d.d.position.y = 0.3 + d.i * 0.2 + (f === 0 ? 0.18 : 0); }
      }
    }
    // the whole path, start to finish, checkpoint by checkpoint
    if (this.checks) {
      const c0 = this.checks[0], next = this.checks[this.ci + 1];
      if (Math.hypot(p.x - c0.x, p.z - c0.z) < 3.5 && p.y < 1) { if (this.ci > 2) this.ci = 0; else if (this.ci === 0) k.once('wonderland', 'Winter Wonderland: drive the whole path to the tree.', 4); }
      if (next && Math.hypot(p.x - next.x, p.z - next.z) < 3.4) {
        this.ci++;
        if (this.ci === this.checks.length - 1 && k.find('wonderland')) { k.callout('WINTER WONDERLAND'); k.synth.chime([523, 659, 784, 1047], { gap: 0.12, dur: 1.2, vol: 0.05 }); }
      }
    }
    // a carol in the red-and-white tunnel, once each time you go in (Deck the Halls, a traditional Welsh air)
    if (this.carolTunnel && this.path) {
      const inT = this._near(p, this.carolTunnel.s0, this.carolTunnel.s1);
      if (inT && !this._inCarol && (this._carolAt || -99) < T - 20) { this._carolAt = T; this._carol(k); }
      this._inCarol = inT;
    }
    // Big Air: off the kicker, over the gap, onto the landing without touching the ground between
    if (this.gap) {
      const G = this.gap;
      if (v.air && p.x > G.x0 - 1.2 && p.x < G.x0 + 0.5 && p.z > G.z0 && p.z < G.z1 && p.y > 1.2) this._flying = true;
      if (this._flying && !v.air) { if (v.on === this.land) { if (k.find('bigair')) k.callout('BIG AIR'); else k.say('Big air!', 1.5); } this._flying = false; }
    }
    // Home run: home, first, second, third and home again on one diamond, in under forty seconds
    for (const d of this.diamonds || []) {
      const b = d.bases[(d.step + 1) % 4], h = d.bases[0];
      if (d.step > 0) d.t += dt;
      if (d.step > 0 && d.t > 40) { d.step = 0; d.t = 0; }
      if (d.step === 0 && Math.hypot(p.x - h.x, p.z - h.z) < 1.3) { d.armed = true; }
      if (d.armed && d.step === 0 && Math.hypot(p.x - h.x, p.z - h.z) > 1.6 && Math.hypot(p.x - d.bases[1].x, p.z - d.bases[1].z) < 1.4) { d.step = 1; d.t = 0; k.say('First base!', 1.2); continue; }
      if (d.step > 0 && Math.hypot(p.x - b.x, p.z - b.z) < 1.4) {
        d.step++;
        if (d.step === 4) { d.step = 0; d.armed = false; if (k.find('homerun')) k.callout('HOME RUN'); else k.say('Home run!', 1.5); k.synth.chime([392, 523, 659, 784], { gap: 0.1, dur: 0.6, vol: 0.05 }); }
        else k.say(['', 'First base!', 'Second base!', 'Third base!'][d.step], 1.2);
      }
    }
    for (const s of this.snowmen || []) s.step(dt);
  },
  _near(p, s0, s1) { for (let i = 0; i < this.path.length; i += 2) { const q = this.path[i]; if (q.s < s0 || q.s > s1) continue; if ((q.x - p.x) ** 2 + (q.z - p.z) ** 2 < 4.4) return true; } return false; },
  _carol(k) {
    // Deck the Halls (traditional Welsh, published with these words in 1862): two lines, softly, in G.
    const N = { G3: 196, A3: 220, B3: 246.9, C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392 };
    const q = 0.3, line = [['G4', 1.5], ['F4', 0.5], ['E4', 1], ['D4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['C4', 1], ['D4', 0.5], ['E4', 0.5], ['F4', 0.5], ['D4', 0.5], ['E4', 1.5], ['D4', 0.5], ['C4', 1], ['B3', 1], ['C4', 2]];
    let t = 0; for (let r = 0; r < 2; r++) for (const [n, d] of line) { k.synth.note(N[n], d * q * 0.95, { type: 'triangle', vol: 0.035, at: t }); t += d * q; }
  },
  spots() {
    const out = [];
    if (this.tree) out.push({ kind: 'secret', id: 'wonderland', name: 'Winter Wonderland (drive the whole path)', x: this.tree.x, y: 0, z: this.tree.z });
    if (this.gap) out.push({ kind: 'secret', id: 'bigair', name: 'Big Air (clear the gap)', x: (this.gap.x0 + this.gap.x1) / 2, y: 0, z: (this.gap.z0 + this.gap.z1) / 2 });
    if (this.diamonds) out.push({ kind: 'secret', id: 'homerun', name: 'Home run (round the bases)', x: this.diamonds[0].bases[2].x, y: 0, z: this.diamonds[0].bases[2].z });
    for (const s of this.snowmen || []) out.push({ kind: 'secret', id: 'snowmen', name: 'Snowman (knock all six down)', x: s.home.x, y: 0, z: s.home.z });
    return out;
  },
  reset() { for (const s of this.snowmen || []) s.reset(); this.downed = 0; this.ci = 0; for (const d of this.diamonds || []) { d.step = 0; d.armed = false; } },
});

function mergeAll(geos) {
  // (a small merge of non-indexed copies: the pieces here are few and simple)
  const list = geos.map(g => (g.index ? g.toNonIndexed() : g));
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
  for (const g of list) {
    const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
    pos.set(P.array, o * 3); if (N) nor.set(N.array, o * 3); if (U) uv.set(U.array, o * 2); o += P.count;
  }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return out;
}
