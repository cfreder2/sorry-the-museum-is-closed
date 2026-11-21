// The drawing kit for lights out of doors (butlerfield.js, lightshow.js): bulbs in one instanced mesh, figures drawn in
// glowing wire, and the strokes of the figures themselves. Colours above 1 glow under the bloom.
import * as THREE from 'three';
export const TAU = Math.PI * 2;
export const canvasTex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
export const lit = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, emissive: new THREE.Color(color).multiplyScalar(0.3), ...o });

// ---------------------------------------------------------------- bulbs
// Every bulb in the show in one InstancedMesh. Each carries its colour, a phase and a mode; the shader makes them
// twinkle (0), chase along their phase (1), burn steady with a faint breath (2) or run through the colours (3).
export class Bulbs {
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
export class Wire {
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
export const C = {
  white: [2.1, 2.15, 2.4], warm: [2.6, 1.9, 1.0], gold: [2.8, 1.9, 0.45], red: [2.8, 0.35, 0.3], green: [0.45, 2.4, 0.6], blue: [0.5, 1.1, 2.9],
  ice: [1.2, 2.0, 2.8], pink: [2.6, 0.9, 1.6], orange: [2.9, 1.1, 0.25], amber: [2.2, 1.2, 0.35], purple: [1.6, 0.6, 2.6], brown: [1.6, 0.9, 0.4],
};
export const circle = (cx, cy, r, n = 24, a0 = 0, a1 = TAU, rx = r) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * r]; });
export const ring3 = (cx, cy, cz, r, axis, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const a = TAU * i / n, c = Math.cos(a) * r, s = Math.sin(a) * r; return axis === 'y' ? [cx + c, cy, cz + s] : axis === 'x' ? [cx, cy + s, cz + c] : [cx + c, cy + s, cz]; });

// A reindeer seen side on, 1.6 m from nose to tail. pose 'stand', 'leap' (legs flung out) or 'graze' (head down: drawn apart).
export function deerBody(pose, col = C.warm) {
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
export function deerHead(col = C.warm, rudolph = false) {
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
export function sleigh() {
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
export function penguin() {
  return [
    { pts: circle(0, 0.72, 0.62, 28, 0, TAU, 0.4), col: C.blue, d: 0.18, ties: 4 },
    { pts: circle(0, 0.64, 0.46, 24, 0, TAU, 0.26), col: C.white, d: 0.2 },
    { pts: circle(-0.12, 1.13, 0.05, 8), col: C.white, d: 0.22 }, { pts: circle(0.12, 1.13, 0.05, 8), col: C.white, d: 0.22 },
    { pts: [[-0.07, 1.02], [0, 0.92], [0.07, 1.02], [-0.07, 1.02]], col: C.orange, d: 0.24 },
    { pts: [[-0.38, 0.92], [-0.62, 0.5], [-0.42, 0.52]], col: C.blue, d: 0.1 }, { pts: [[0.38, 0.92], [0.62, 0.5], [0.42, 0.52]], col: C.blue, d: 0.1 },
    { pts: [[-0.3, 0.04], [-0.05, 0.04], [-0.15, 0.14]], col: C.orange, d: 0.15 }, { pts: [[0.3, 0.04], [0.05, 0.04], [0.15, 0.14]], col: C.orange, d: 0.15 },
  ];
}
export function polarBear() {
  return [
    { pts: [[0.05, 0.62], [0.15, 0.85], [0.55, 0.95], [1.0, 0.93], [1.2, 0.86], [1.32, 0.92], [1.5, 0.95], [1.68, 0.85], [1.8, 0.74], [1.72, 0.68], [1.55, 0.66], [1.42, 0.6], [1.35, 0.45], [1.3, 0.05], [1.12, 0.05], [1.1, 0.38], [0.6, 0.38], [0.5, 0.05], [0.32, 0.05], [0.28, 0.4], [0.1, 0.45], [0.05, 0.62]], col: C.ice, d: 0.26, ties: 2 },
    { pts: [[1.38, 0.93], [1.4, 1.03], [1.48, 0.96]], col: C.ice, d: 0.16 },
    { pts: circle(1.6, 0.82, 0.025, 6), col: C.blue, d: 0.12 }, { pts: circle(1.79, 0.74, 0.03, 6), col: C.blue, d: 0 },
  ];
}
export function snowman(scale = 1, scarf = C.red) {
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
export function candyCane() {
  const path = [];
  for (let y = 0; y <= 1.6; y += 0.08) path.push([0, y]);
  for (let i = 1; i <= 14; i++) { const a = Math.PI - Math.PI * i / 14; path.push([0.3 + Math.cos(a) * 0.3, 1.6 + Math.sin(a) * 0.3]); }
  path.push([0.6, 1.5]); path.push([0.6, 1.4]);
  const s = [];
  for (let i = 0; i < path.length - 1; i++) s.push({ pts: [path[i], path[i + 1]], col: (Math.floor(i / 2) % 2) ? C.white : C.red, d: 0.05, ties: 1 });
  return s;
}
export function ornament(col, r = 0.75) {
  const s = [], y = r + 0.08;
  for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; s.push({ pts: Array.from({ length: 29 }, (_, j) => { const t = TAU * j / 28; return [Math.cos(t) * r * Math.cos(a), y + Math.sin(t) * r, Math.cos(t) * r * Math.sin(a)]; }), col, d: 0 }); }
  for (const h of [-0.5, 0, 0.5]) { const rr = r * Math.sqrt(1 - h * h); s.push({ pts: ring3(0, y + h * r, 0, rr, 'y'), col: h ? col : C.gold, d: 0 }); }
  s.push({ pts: ring3(0, y + r + 0.1, 0, 0.13, 'y', 12), col: C.gold, d: 0 }); s.push({ pts: circle(0, y + r + 0.26, 0.09, 10), col: C.gold, d: 0 });
  return s;
}
export function present(w, h, d, box, ribbon) {
  const s = [], X = w / 2, Z = d / 2, E = [[-X, 0, -Z], [X, 0, -Z], [X, 0, Z], [-X, 0, Z]];
  for (const y of [0.02, h]) s.push({ pts: [...E, E[0]].map(p => [p[0], y, p[2]]), col: box, d: 0 });
  for (const p of E) s.push({ pts: [[p[0], 0.02, p[2]], [p[0], h, p[2]]], col: box, d: 0 });
  s.push({ pts: [[0, 0.02, -Z], [0, h, -Z], [0, h, Z], [0, 0.02, Z]], col: ribbon, d: 0 });
  s.push({ pts: [[-X, 0.02, 0], [-X, h, 0], [X, h, 0], [X, 0.02, 0]], col: ribbon, d: 0 });
  for (const sx of [-1, 1]) s.push({ pts: circle(0, 0, 0.16, 12).map(p => [sx * (0.16 + p[0]), h + 0.12 + p[1] * 0.75, 0]), col: ribbon, d: 0 });
  return s;
}
// A star, drawn twice at right angles so it reads from every side as it turns.
export function star(R = 0.7, col = C.gold) {
  const pts = []; for (let i = 0; i <= 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * 0.4 : R; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  return [{ pts, col, d: 0 }, { pts: pts.map(([x, y]) => [x * 0.6, y * 0.6]), col: C.white, d: 0 },
    { pts: pts.map(([x, y]) => [0, y, x]), col, d: 0 }, { pts: pts.map(([x, y]) => [0, y * 0.6, x * 0.6]), col: C.white, d: 0 }];
}
export function snowflake(R = 0.6) {
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
export function signBoard(w, h, lines, bg = '#0c1a2c', ink = '#fff3cf') {
  const t = canvasTex(1024, Math.round(1024 * h / w), (c, W, H) => {
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#d9b45a'; c.lineWidth = 10; c.strokeRect(14, 14, W - 28, H - 28);
    for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.5})`; c.beginPath(); c.arc(30 + Math.random() * (W - 60), 30 + Math.random() * (H - 60), 1 + Math.random() * 2.5, 0, TAU); c.fill(); }
    c.textAlign = 'center'; c.textBaseline = 'middle';
    lines.forEach(([txt, size, col, y]) => { c.fillStyle = col || ink; c.font = `700 ${size}px Georgia, 'Times New Roman', serif`; c.shadowColor = col || ink; c.shadowBlur = 18; c.fillText(txt, W / 2, H * y); });
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(1.5, 1.5, 1.5), side: THREE.DoubleSide }));
}

export function mergeAll(geos) {
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
