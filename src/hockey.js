// Pond hockey.
//
// North of the building, between the garden and the railway, there is a pond, frozen hard: a goal
// at each end, a puck, and on the bank a scorer's table with the score picked out in coloured pegs
// of light. A blue toy car is waiting by its goal. Push the puck and it wakes up. First to five.
// You shoot east; it shoots west.

import * as THREE from 'three';
import * as TX from './textures.js';
import { buildCar } from './vehicles.js';
import { iceMaterial } from './icelook.js';

// Five pegs by seven for each figure.
const DIGIT = ['01110 10001 10011 10101 11001 10001 01110', '00100 01100 00100 00100 00100 00100 01110', '01110 10001 00001 00010 00100 01000 11111', '11110 00001 00001 01110 00001 00001 11110', '00010 00110 01010 10010 11111 00010 00010',
  '11111 10000 11110 00001 00001 10001 01110', '00110 01000 10000 11110 10001 10001 01110', '11111 00001 00010 00100 01000 01000 01000', '01110 10001 10001 01110 10001 10001 01110', '01110 10001 10001 01111 00001 00010 01100'].map(s => s.split(' '));
const WIN = 5;

export class Hockey {
  constructor(museum, plan, sound) {
    const R = this.R = plan.rink;
    this.sound = sound; this.you = 0; this.bot = 0; this.onEvent = null; this.pause = 0; this.live = false; this.over = 0;
    if (!R) return;
    const g = this.group = new THREE.Group(); g.position.set(R.x, 0, R.z); museum.group.add(g);
    const std = o => new THREE.MeshStandardMaterial(o), put = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
    // The ice: black and polished, in a bank of shovelled snow. Not the harbour's wild ice: a pond that is flooded and
    // skated on, so few cracks and no drifts, but scored all over with the long arcs of skates (and tyres), a little
    // milky where it was flooded last, and the snow the shovels left lying in along its rim (src/icelook.js).
    const ice = new THREE.Mesh(new THREE.CircleGeometry(1, 64), iceMaterial({ mirror: museum.mirror, zone: [0.1, 0.34, 0, 0.16], rim: [R.x, R.z, R.rx, R.rz], scratch: 0.34, crack: 0.5, tile: 7.5, params: { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 } }));
    ice.rotation.x = -Math.PI / 2; ice.scale.set(R.rx, R.rz, 1); ice.position.set(R.x, 0.011, R.z); ice.updateMatrix(); ice.matrixAutoUpdate = false; museum.group.add(ice); museum.floors.push(ice);
    const snowTex = museum.snowTex, snow = std({ map: snowTex, roughness: 0.95, emissiveMap: snowTex, emissive: new THREE.Color(0.3, 0.36, 0.52), emissiveIntensity: 0.55 });
    const pts = []; for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * (R.rx + 0.3), 0.05, Math.sin(a) * (R.rz + 0.3))); }
    const bank = put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 96, 0.34, 6, true), snow, 0, 0, 0); bank.scale.y = 0.55;
    // The lines, painted under the ice.
    const paint = (w, d, x, c) => { const m = put(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), x, 0.013, 0); m.rotation.x = -Math.PI / 2; };
    paint(0.14, R.rz * 2 - 0.4, 0, 0xc0221c); for (const sx of [-1, 1]) { paint(0.1, R.rz * 1.3, sx * R.gx, 0xc0221c); paint(0.14, R.rz * 1.86, sx * R.rx * 0.36, 0x2a5cc0); }
    const ring = put(new THREE.RingGeometry(1.6, 1.72, 40), new THREE.MeshBasicMaterial({ color: 0x2a5cc0, transparent: true, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), 0, 0.013, 0); ring.rotation.x = -Math.PI / 2;
    // The goals: red pipe and a white net.
    const pipe = std({ color: 0xc8261c, roughness: 0.5, emissive: 0x6a100a, emissiveIntensity: 0.8 }), net = new THREE.MeshBasicMaterial({ map: this._net(), transparent: true, side: THREE.DoubleSide, depthWrite: false, color: new THREE.Color(0.8, 0.82, 0.9) });
    for (const sx of [-1, 1]) {
      const x = sx * R.gx, W = R.gw, H = 0.9, D = 0.9;
      for (const sz of [-1, 1]) { put(new THREE.CylinderGeometry(0.04, 0.04, H, 8), pipe, x, H / 2, sz * W); plan.obstacles.push({ x0: R.x + x - 0.05, x1: R.x + x + 0.05, z0: R.z + sz * W - 0.05, z1: R.z + sz * W + 0.05, y0: 0, y1: H }); }
      put(new THREE.CylinderGeometry(0.04, 0.04, W * 2, 8), pipe, x, H, 0).rotation.x = Math.PI / 2;
      const back = put(new THREE.PlaneGeometry(W * 2, H), net, x + sx * D, H / 2, 0); back.rotation.y = Math.PI / 2;
      const top = put(new THREE.PlaneGeometry(D, W * 2), net, x + sx * D / 2, H, 0); top.rotation.x = -Math.PI / 2;
      for (const sz of [-1, 1]) put(new THREE.PlaneGeometry(D, H), net, x + sx * D / 2, H / 2, sz * W);
    }
    // The puck.
    this.puck = { x: 0, z: 0, vx: 0, vz: 0, r: 0.24, mesh: put(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.9, 0.12) }), 0, 0.06, 0) };       // bright orange, like a street-hockey ball: black on black ice could not be seen
    put(new THREE.TorusGeometry(0.15, 0.012, 6, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 0.9, 0.2) }), 0, 0, 0).visible = false;
    this.halo = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), color: new THREE.Color(1.0, 0.45, 0.08), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); this.halo.rotation.x = -Math.PI / 2; this.halo.renderOrder = 4; g.add(this.halo);       // and a pool of its own light on the ice round it
    // The other side: a blue car, parked in front of its goal until something happens.
    const m = buildCar(0x1f4f8a); if (m.lamp) m.group.remove(m.lamp, m.lamp.target);
    g.add(m.group); this.rival = { m, x: R.gx - 2.2, z: 0, yaw: -Math.PI / 2, v: 0, r: 0.19 };
    // The scorer's table on the north bank, and on it the board: pegs of light pushed into black.
    const tx = 0, tz = -R.rz - 1.9, wood = std({ color: 0x6a4526, roughness: 0.6, emissive: 0x4a2e18, emissiveIntensity: 0.5 });
    put(new THREE.BoxGeometry(3.4, 0.08, 1.0), wood, tx, 0.72, tz); for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(new THREE.BoxGeometry(0.08, 0.72, 0.08), wood, tx + sx * 1.55, 0.36, tz + sz * 0.4);
    put(new THREE.BoxGeometry(3.0, 1.25, 0.1), std({ color: 0x08090b, roughness: 0.6 }), tx, 1.42, tz - 0.2); put(new THREE.BoxGeometry(3.1, 0.06, 0.16), std({ color: 0xc8261c, roughness: 0.5, emissive: 0x6a100a, emissiveIntensity: 0.8 }), tx, 2.07, tz - 0.2);
    plan.obstacles.push({ x0: R.x + tx - 1.7, x1: R.x + tx + 1.7, z0: R.z + tz - 0.5, z1: R.z + tz + 0.5, y0: 0, y1: 2 });
    const COLS = 23, ROWS = 9, n = COLS * ROWS, P = new Float32Array(n * 3);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const i = r * COLS + c; P[i * 3] = tx + (c - (COLS - 1) / 2) * 0.118; P[i * 3 + 1] = 1.88 - r * 0.118; P[i * 3 + 2] = tz - 0.14; }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(P, 3)); this.pegCol = new THREE.BufferAttribute(new Float32Array(n * 3), 3); bg.setAttribute('aCol', this.pegCol);
    this.COLS = COLS; this.ROWS = ROWS;
    const pegs = new THREE.Points(bg, new THREE.ShaderMaterial({
      vertexShader: `attribute vec3 aCol; varying vec3 vC; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vC = aCol; gl_PointSize = clamp(0.13 * projectionMatrix[1][1] * 400.0 / max(-mv.z, 0.05), 2.0, 26.0); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vC; void main() { float a = smoothstep(0.5, 0.12, length(gl_PointCoord - 0.5)); gl_FragColor = vec4(vC * a, a); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    pegs.frustumCulled = false; g.add(pegs);
    this._board(); this._faceoff(false);
  }
  _net() { const [c, x] = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; return [cv, cv.getContext('2d')]; })(); x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 2; for (let i = 0; i <= 64; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 64); x.moveTo(0, i); x.lineTo(64, i); x.stroke(); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); return t; }

  // The score in pegs: yours in red and amber on the left, a white bar, the machine's in blue on the right; the rest of the board dotted about in dim colours.
  _board() {
    const C = this.pegCol.array, COLS = this.COLS, dim = [[0.1, 0.02, 0.02], [0.02, 0.09, 0.03], [0.02, 0.04, 0.12], [0.1, 0.08, 0.02]];
    for (let i = 0; i < COLS * this.ROWS; i++) { const d = (i * 7 + ((i / COLS) | 0) * 3) % 11 < 2 ? dim[i % 4] : [0, 0, 0]; C[i * 3] = d[0]; C[i * 3 + 1] = d[1]; C[i * 3 + 2] = d[2]; }
    const fig = (n, c0, col) => { const d = DIGIT[Math.min(9, n)]; for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (d[r][c] === '1') { const i = (r + 1) * COLS + c0 + c; C[i * 3] = col[0]; C[i * 3 + 1] = col[1]; C[i * 3 + 2] = col[2]; } };
    fig(this.you, 4, [2.6, 0.7, 0.2]); fig(this.bot, 14, [0.4, 1.0, 2.8]);
    for (let r = 1; r < 8; r++) { const i = r * COLS + 11; C[i * 3] = C[i * 3 + 1] = C[i * 3 + 2] = 1.8; }
    this.pegCol.needsUpdate = true;
  }
  _faceoff(wake) { const p = this.puck, b = this.rival, R = this.R; p.x = p.z = p.vx = p.vz = 0; b.x = R.gx - 1.4; b.z = -R.gw - 1.7; b.yaw = -Math.PI / 2; b.v = 0; b.rest = 0; this.live = wake; this.pause = wake ? 1.6 : 0; }
  reset() { if (!this.R) return; this.you = this.bot = 0; this._board(); this._faceoff(false); }
  _goal(mine) {
    if (mine) this.you++; else this.bot++;
    this._board(); this.sound.finish();
    const done = this.you >= WIN || this.bot >= WIN;
    if (this.onEvent) this.onEvent(done ? (mine ? 'YOU WIN  ' : 'THE BLUE CAR WINS  ') + this.you + ' – ' + this.bot : (mine ? 'GOAL!  ' : 'IT SCORES  ') + this.you + ' – ' + this.bot);
    this._faceoff(true);
    if (done) { this.over = 4; this.pause = 4; }
  }

  // v: the toy in use. Everything is worked in the pond's own frame, its middle at the origin.
  update(dt, v) {
    const R = this.R;
    if (!R) return;
    const p = this.puck, b = this.rival, vx = v.pos.x - R.x, vz = v.pos.z - R.z, low = v.pos.y < 0.5;
    const inside = (x, z, m = 0) => (x / (R.rx - m)) ** 2 + (z / (R.rz - m)) ** 2 < 1;
    // Wander off and the game is off: everything goes back to its place and the score to nothing.
    if (Math.hypot(vx, vz) > R.rx + 14 && (this.live || this.you || this.bot)) { this.away = (this.away || 0) + dt; if (this.away > 1.5) { this.reset(); if (this.onEvent) this.onEvent(null, 'left'); } } else this.away = 0;
    if (this.over > 0) { this.over -= dt; if (this.over <= 0) { this.you = this.bot = 0; this._board(); } }
    // Anything that drives into the puck sends it on its way.
    const strike = (mx, mz, mvx, mvz, mr) => {
      const dx = p.x - mx, dz = p.z - mz, d = Math.hypot(dx, dz), rr = mr + p.r;
      if (d >= rr || d < 1e-6) return false;
      const nx = dx / d, nz = dz / d, vn = (mvx - p.vx) * nx + (mvz - p.vz) * nz;
      if (vn > 0) { p.vx += nx * vn * 1.55; p.vz += nz * vn * 1.55; }
      p.x = mx + nx * rr; p.z = mz + nz * rr;
      return vn > 0.6;
    };
    if (low && strike(vx, vz, v.vel.x, v.vel.z, v.radius || 0.19)) { this.sound.knock(Math.hypot(p.vx, p.vz), false); if (!this.live) { this.live = true; if (this.onEvent) this.onEvent(null, 'wake'); } }
    if (this.pause > 0) this.pause -= dt;
    // The blue car. It goes round behind the puck and then drives through it at your goal.
    if (this.live && this.pause <= 0) {
      const gl = Math.hypot(-R.gx - p.x, -p.z) || 1, ax = (-R.gx - p.x) / gl, az = -p.z / gl;          // from the puck towards your goal: the way it wants the puck to go
      const rx = b.x - p.x, rz = b.z - p.z, rl = Math.hypot(rx, rz) || 1;
      const lined = (-rx * ax - rz * az) / rl;                 // 1 when the car, the puck and your goal are in a line, in that order
      let tx, tz;
      if (lined > 0.88) { tx = p.x + ax * 1.2; tz = p.z + az * 1.2; }                                     // lined up: straight through it
      else if (rx * ax + rz * az > -0.2) {                                                                // on the wrong side: swing out round it
        const side = rx * -az + rz * ax > 0 ? 1 : -1;
        tx = p.x - ax * 0.5 - az * side * 1.3; tz = p.z - az * 0.5 + ax * side * 1.3;
      } else { tx = p.x - ax * 1.3; tz = p.z - az * 1.3; }                                                // behind it but off the line: get on the line
      let want = Math.atan2(tx - b.x, tz - b.z) - b.yaw; while (want > Math.PI) want -= Math.PI * 2; while (want < -Math.PI) want += Math.PI * 2;
      b.yaw += Math.max(-3.0 * dt, Math.min(3.0 * dt, want));
      // It slows to turn, so that it can turn inside the space it has, and puts its foot down when it is pointing the right way.
      // It is a slower car than yours, it lines its shots up roughly, and after every touch it takes a moment to think.
      const top = (b.rest > 0 ? 0.8 : lined > 0.88 ? 4.6 : 3.6) * Math.max(0.22, 1 - Math.abs(want) / 1.5);
      b.rest = Math.max(0, (b.rest || 0) - dt);
      b.v += Math.max(-6 * dt, Math.min(4.5 * dt, top - b.v));
    } else b.v *= Math.exp(-4 * dt);
    b.x += Math.sin(b.yaw) * b.v * dt; b.z += Math.cos(b.yaw) * b.v * dt;
    if (!inside(b.x, b.z, 0.4)) { const k = Math.sqrt((b.x / (R.rx - 0.4)) ** 2 + (b.z / (R.rz - 0.4)) ** 2); b.x /= k; b.z /= k; b.v *= 0.9; }
    if (low) { const dx = b.x - vx, dz = b.z - vz, d = Math.hypot(dx, dz); if (d < 0.42 && d > 1e-6) { b.x = vx + dx / d * 0.42; b.z = vz + dz / d * 0.42; b.v *= 0.8; } }
    if (strike(b.x, b.z, Math.sin(b.yaw) * b.v, Math.cos(b.yaw) * b.v, b.r)) { this.sound.knock(Math.hypot(p.vx, p.vz), false); b.rest = 0.6; }
    // The puck slides a long way on ice and bounces off the bank and the posts.
    const f = Math.exp(-0.2 * dt); p.vx *= f; p.vz *= f;
    const sp = Math.hypot(p.vx, p.vz); if (sp > 16) { p.vx *= 16 / sp; p.vz *= 16 / sp; }
    const ox = p.x; p.x += p.vx * dt; p.z += p.vz * dt;
    for (const sx of [-1, 1]) {
      const line = sx * R.gx;
      if ((ox - line) * sx <= 0 && (p.x - line) * sx > 0) {                         // crossing a goal line, going in
        if (Math.abs(p.z) < R.gw - p.r * 0.5 && this.pause <= 0 && this.over <= 0) { this._goal(sx > 0); break; }
      }
      if (Math.abs(p.x - line) < 0.2 && Math.abs(Math.abs(p.z) - R.gw) < 0.2) { p.vz = -p.vz * 0.7; p.vx = -p.vx * 0.5; p.z += Math.sign(p.vz) * 0.1; }     // a post
      if ((p.x - line) * sx > 0.75 && Math.abs(p.z) < R.gw) { p.vx = -p.vx * 0.3; p.x = line + sx * 0.75; }                                                  // the back of the net, if no goal was given
    }
    if (!inside(p.x, p.z, p.r)) {
      const k = Math.sqrt((p.x / (R.rx - p.r)) ** 2 + (p.z / (R.rz - p.r)) ** 2); p.x /= k; p.z /= k;
      let nx = p.x / (R.rx * R.rx), nz = p.z / (R.rz * R.rz); const nl = Math.hypot(nx, nz); nx /= nl; nz /= nl;
      const into = p.vx * nx + p.vz * nz; if (into > 0) { p.vx -= nx * into * 1.75; p.vz -= nz * into * 1.75; if (into > 2) this.sound.knock(into, true); }
    }
    p.mesh.position.set(p.x, 0.06, p.z); this.halo.position.set(p.x, 0.02, p.z);
    b.m.group.position.set(b.x, 0.012, b.z); b.m.group.rotation.y = b.yaw;
    if (b.m.wheels) for (const w of b.m.wheels) w.spin.rotation.x += b.v / w.r * dt;
  }
}
