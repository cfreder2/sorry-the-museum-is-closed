// Ice fishing on Monroe Harbor (features.js). A hole augered through clear black ice, with the harbour under it:
// weed, stones, and yellow perch and smelt swimming in the dark water, seen through the ice as you drive over it.
// FISH stands over the hole with a little ice rod. It plays like the best-loved fishing in games: put the jig where a
// fish is (the sonar shows the depths), jiggle to tempt it, and it comes, nibbles once or twice, then takes it with a big
// tug and a "!". Yank then and it is yours: up it comes. Too soon, on a nibble, and it is off. Three is the secret.
import * as THREE from 'three';
import { feature } from './features.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildKind, Fish, glowCaught } from './fishkit.js';      // (the fish: shared with the Moon's ponds)

const lit = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, emissive: new THREE.Color(color).multiplyScalar(0.35), ...o });
const canvas = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const rng = s => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
const lerp = (a, b, t) => a + (b - a) * t;
feature({
  id: 'icefish',
  lazy: { x: 550, z: 122, r: 160 },      // built the first time the toy comes this near (features.js), not at start-up
  secrets: [['icefish', 'Ice fishing']],
  // (A generator: each yield is a place the building of it can stop until the next frame. features.js, `begin`.)
  *init(k) {
    this.k = k; const L = k.plan.lakefront; if (!L || !L.window) return;
    const W = this.W = L.window, x = L.fish.x, z = L.fish.z, r = this.r = rng(4242);
    this.at = { x, y: 0, z }; this.caught = 0; this.fishes = []; this.bucketed = [];
    this.DEEP = 2.6;
    const g = this.g = new THREE.Group(); g.position.set(x, 0, z); g.visible = false; k.group.add(g);      // (hidden until it all stands: features.js builds it a part at a time, and k.ready shows it)
    const wx0 = W.x0 - x, wx1 = W.x1 - x, wz0 = W.z0 - z, wz1 = W.z1 - z, D = this.DEEP;
    // ---- under the ice: the water's sides falling away into the dark, the bottom, stones and weed
    {
      const box = new THREE.BoxGeometry(wx1 - wx0, D, wz1 - wz0, 1, 4, 1), P = box.attributes.position, col = [];
      for (let i = 0; i < P.count; i++) { const t = (P.getY(i) + D / 2) / D; col.push(lerp(0.01, 0.07, t), lerp(0.05, 0.22, t), lerp(0.07, 0.26, t)); }
      box.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); box.translate((wx0 + wx1) / 2, -D / 2 - 0.02, (wz0 + wz1) / 2);
      g.add(new THREE.Mesh(box, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false })));
      const bed = canvas(256, 256, (c, w, h) => { c.fillStyle = '#1c2a26'; c.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { const v = 26 + r() * 46; c.fillStyle = `rgba(${v},${v + 10},${v + 6},.55)`; c.beginPath(); c.arc(r() * w, r() * h, 0.6 + r() * 1.6, 0, 7); c.fill(); }
        const gl = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.6); gl.addColorStop(0, 'rgba(90,150,140,.22)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gl; c.fillRect(0, 0, w, h); });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(wx1 - wx0, wz1 - wz0), new THREE.MeshBasicMaterial({ map: bed, fog: false })); floor.rotation.x = -Math.PI / 2; floor.position.set((wx0 + wx1) / 2, -D + 0.005, (wz0 + wz1) / 2); g.add(floor);
      const stones = []; for (let i = 0; i < 14; i++) { const s = new THREE.DodecahedronGeometry(0.08 + r() * 0.22, 0); s.scale(1, 0.45 + r() * 0.3, 0.8 + r() * 0.4); s.rotateY(r() * 6); s.translate(lerp(wx0 + 0.3, wx1 - 0.3, r()), -D + 0.03, lerp(wz0 + 0.3, wz1 - 0.3, r())); stones.push(s); }
      g.add(new THREE.Mesh(mergeGeometries(stones), new THREE.MeshLambertMaterial({ color: 0x3f4d48, emissive: 0x1a2b2a })));
      // Weed: ribbons up from the bottom, swaying (each a strip bent by the same shader trick as the fish).
      const weeds = []; for (let i = 0; i < 26; i++) { const h = 0.5 + r() * 1.3, wd = 0.03 + r() * 0.03, q = new THREE.PlaneGeometry(wd, h, 1, 6); q.translate(0, h / 2, 0); q.rotateY(r() * 3); q.translate(lerp(wx0 + 0.25, wx1 - 0.25, r()), -D, lerp(wz0 + 0.25, wz1 - 0.25, r())); weeds.push(q); }
      this.weedU = { uT: { value: 0 } };
      const wm = new THREE.MeshLambertMaterial({ color: 0x3c6a2e, emissive: 0x16301a, side: THREE.DoubleSide });
      wm.onBeforeCompile = sh => { sh.uniforms.uT = this.weedU.uT; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        { vec4 wp = modelMatrix * vec4(transformed, 1.0); float up = clamp(wp.y + ${D.toFixed(2)}, 0.0, 2.0); transformed.x += sin(uT * 0.9 + wp.x * 2.1 + wp.z) * 0.07 * up * up; transformed.z += cos(uT * 0.7 + wp.z * 1.7) * 0.05 * up * up; }`); };
      g.add(new THREE.Mesh(mergeGeometries(weeds), wm));
      // a glow in the water under the hole, where the lantern's light comes down
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: radial(), color: new THREE.Color(0.1, 0.24, 0.24), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      glow.rotation.x = -Math.PI / 2; glow.position.y = -D + 0.02; g.add(glow);
    }
    yield;
    // ---- the clear ice over it all: black ice, frost lying on it in drifts, cracks, snow banked at the edges, the hole
    {
      const T = canvas(512, 512, (c, w, h) => {
        c.clearRect(0, 0, w, h);
        // see-through in the middle, frosting up towards the edges until it is the harbour's own white ice
        const gr = c.createRadialGradient(w / 2, h / 2, w * 0.08, w / 2, h / 2, w * 0.52); gr.addColorStop(0, 'rgba(200,220,236,.16)'); gr.addColorStop(0.55, 'rgba(195,212,230,.3)'); gr.addColorStop(0.85, 'rgba(188,205,226,.85)'); gr.addColorStop(1, 'rgba(185,203,224,1)');
        c.fillStyle = gr; c.fillRect(0, 0, w, h);
        c.fillStyle = 'rgba(185,203,224,1)'; c.fillRect(0, 0, w, 10); c.fillRect(0, h - 10, w, 10); c.fillRect(0, 0, 10, h); c.fillRect(w - 10, 0, 10, h);
        for (let i = 0; i < 70; i++) { const px = r() * w, py = r() * h, d = Math.hypot(px - w / 2, py - h / 2) / (w / 2); c.fillStyle = `rgba(230,240,252,${(0.05 + r() * 0.2) * Math.min(1, d * 1.4)})`; c.beginPath(); c.ellipse(px, py, 10 + r() * 50, 5 + r() * 18, r() * 3, 0, 7); c.fill(); }
        c.strokeStyle = 'rgba(235,245,255,.28)'; c.lineWidth = 0.8; for (let i = 0; i < 11; i++) { let px = w / 2 + (r() - 0.5) * 60, py = h / 2 + (r() - 0.5) * 60; c.beginPath(); c.moveTo(px, py); const a = r() * 6.28; for (let kk = 0; kk < 7; kk++) { px += Math.cos(a + (r() - 0.5)) * 34; py += Math.sin(a + (r() - 0.5)) * 34; c.lineTo(px, py); } c.stroke(); }
        // the hole, and the slush round it
        const R = 0.2 / 8 * w; c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(w / 2, h / 2, R, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
        const sl = c.createRadialGradient(w / 2, h / 2, R, w / 2, h / 2, R * 2.6); sl.addColorStop(0, 'rgba(240,246,255,.95)'); sl.addColorStop(1, 'rgba(240,246,255,0)'); c.fillStyle = sl; c.beginPath(); c.arc(w / 2, h / 2, R * 2.6, 0, 7); c.arc(w / 2, h / 2, R, 0, 7, true); c.fill();
      });
      T.colorSpace = THREE.SRGBColorSpace;
      const ice = new THREE.Mesh(new THREE.PlaneGeometry(wx1 - wx0, wz1 - wz0), new THREE.MeshStandardMaterial({ map: T, transparent: true, depthWrite: false, roughness: 0.12, metalness: 0.1, emissive: new THREE.Color(0.2, 0.26, 0.4), emissiveMap: T, emissiveIntensity: 0.55 }));
      ice.rotation.x = -Math.PI / 2; ice.position.set((wx0 + wx1) / 2, 0.01, (wz0 + wz1) / 2); ice.renderOrder = 3; g.add(ice);
      // the hole's water, a shade lighter, and a ring when anything stirs it
      this.water = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), new THREE.MeshBasicMaterial({ color: 0x1d4d5c, transparent: true, opacity: 0.45, depthWrite: false, fog: false })); this.water.rotation.x = -Math.PI / 2; this.water.position.y = -0.05; this.water.renderOrder = 2; g.add(this.water);
      this.ripple = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.05, 32), new THREE.MeshBasicMaterial({ color: 0xcfe6f2, transparent: true, opacity: 0, depthWrite: false })); this.ripple.rotation.x = -Math.PI / 2; this.ripple.position.y = -0.045; this.ripple.renderOrder = 4; g.add(this.ripple);
      // the ice is thick: its cut edge shows down the side of the hole
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xa8c8dc, roughness: 0.2, transparent: true, opacity: 0.75, side: THREE.BackSide, emissive: 0x3a5a70, emissiveIntensity: 0.6 })); wall.position.y = -0.06; g.add(wall);
      const chips = []; for (let i = 0; i < 18; i++) { const a = r() * 6.28, d = 0.23 + r() * 0.16, q = new THREE.DodecahedronGeometry(0.006 + r() * 0.012, 0); q.scale(1, 0.45, 1); q.rotateY(r() * 3); q.translate(Math.cos(a) * d, 0.012, Math.sin(a) * d); chips.push(q); }
      g.add(new THREE.Mesh(mergeGeometries(chips), lit(0xdde8f2, { roughness: 0.3, transparent: true, opacity: 0.85 })));
    }
    yield;
    // ---- on the ice: the rod in its holder, a lantern, a stool, the bucket, the shanty
    {
      const wood = lit(0x6b4426), dark = lit(0x2a2a2a, { roughness: 0.5 });
      // The rod: a short ice rod. Cork grip, a little spinning reel under it, and a blank that bends with what is on the line,
      // three guides and a tip-top for the line to run through. Built along its own x, the reel seat at 0; it rests in a
      // holder until you fish, then you hold it out over the hole.
      const rod = this.rod = new THREE.Group(); rod.matrixAutoUpdate = false;
      const cork = lit(0xb08a5a, { roughness: 0.9 }), black = lit(0x22252b, { metalness: 0.4, roughness: 0.35 }), chrome = lit(0xc8ccd2, { metalness: 0.8, roughness: 0.25 });
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.17, 12), cork); grip.rotation.z = Math.PI / 2; grip.position.x = -0.1;
      const butt = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 8), black); butt.position.x = -0.185;
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.05, 10), black); seat.rotation.z = Math.PI / 2; seat.position.x = -0.0;
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.022, 0.006), black); foot.position.set(0, -0.016, 0);
      const spool = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.022, 18), chrome); spool.rotation.z = Math.PI / 2; spool.position.set(0.012, -0.034, 0);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.02, 14), black); body.rotation.z = Math.PI / 2; body.position.set(-0.008, -0.034, 0);
      const crank = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, 0.03), chrome); crank.position.set(-0.008, -0.034, 0.024);
      rod.add(grip, butt, seat, foot, spool, body, crank);
      this.ROD = 0.56; this.SEGS = 12;
      const seg = new THREE.CylinderGeometry(1, 1, 1, 7, 1, true); seg.translate(0, 0.5, 0);
      const blankM = lit(0x1c2e4a, { metalness: 0.35, roughness: 0.3 });
      this.segs = []; for (let i = 0; i < this.SEGS; i++) { const m = new THREE.Mesh(seg, blankM); rod.add(m); this.segs.push(m); }
      const ring = new THREE.TorusGeometry(1, 0.22, 5, 12);
      this.guides = [0.28, 0.56, 0.8, 1].map((u, i) => { const m = new THREE.Mesh(ring, chrome); m.userData.u = u; m.userData.r = i === 3 ? 0.0035 : 0.007 - i * 0.0012; rod.add(m); return m; });
      this.tipBall = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff5a2a })); rod.add(this.tipBall);
      g.add(rod);
      this.holder = new THREE.Group(); const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.22, 8), wood); post.position.y = 0.11; this.holder.add(post); this.holder.position.set(-0.55, 0, 0.15); g.add(this.holder);
      // Line: rod tip, down through the hole, to the jig. The jig: a lead head, painted, and a little marabou tail.
      this.lineGeo = new THREE.BufferGeometry(); this.lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(21), 3));
      const line = new THREE.Line(this.lineGeo, new THREE.LineBasicMaterial({ color: 0xe8f0f4, transparent: true, opacity: 0.85 })); line.frustumCulled = false; g.add(line);
      const jig = this.jig = new THREE.Group();
      jig.add(new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf2b21a, emissive: 0x8a5a00, emissiveIntensity: 0.9, roughness: 0.3 })));
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.04, 6), new THREE.MeshStandardMaterial({ color: 0xff4a3a, emissive: 0x902010, emissiveIntensity: 0.8 })); tail.position.y = -0.026; tail.rotation.z = Math.PI; jig.add(tail);
      const spot = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ map: radial(), color: new THREE.Color(0.9, 0.7, 0.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); spot.rotation.x = -Math.PI / 2; this.jigGlow = spot; jig.add(spot);
      g.add(jig);
      // the lantern, the stool, the bucket
      const lantern = new THREE.Group(); lantern.position.set(-0.75, 0, 0.7); g.add(lantern);
      lantern.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.02, 12), dark));
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.5, 0.7) })); glass.position.y = 0.07; lantern.add(glass);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.04, 12), dark); cap.position.y = 0.14; lantern.add(cap);
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({ map: radial(), color: new THREE.Color(0.3, 0.21, 0.1), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.015; pool.renderOrder = 5; lantern.add(pool);
      const stool = new THREE.Group(); stool.position.set(-1.1, 0, 0.1); g.add(stool);
      { const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.03, 16), lit(0x7a2a22)); seat.position.y = 0.3; stool.add(seat); }
      for (let i = 0; i < 3; i++) { const a = i * 2.09, leg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.32, 6), dark); leg.position.set(Math.cos(a) * 0.08, 0.15, Math.sin(a) * 0.08); leg.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); stool.add(leg); }
      this.bucket = new THREE.Group(); this.bucket.position.set(0.75, 0, 0.55); g.add(this.bucket);
      const pail = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.22, 18, 1, true), lit(0xb4502a, { roughness: 0.5, side: THREE.DoubleSide })); pail.position.y = 0.11; this.bucket.add(pail);
      const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.1, 18), lit(0x8a3a1e)); bottom.rotation.x = -Math.PI / 2; bottom.position.y = 0.01; this.bucket.add(bottom);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.004, 4, 20, Math.PI), lit(0x888888, { metalness: 0.6 })); handle.position.y = 0.22; handle.rotation.y = 0.4; this.bucket.add(handle);
      k.plan.obstacles.push({ x0: x + 0.62, x1: x + 0.88, z0: z + 0.42, z1: z + 0.68, y0: -0.3, y1: 0.22 });
      // The shanty: boards, a door, a stovepipe, a lit window.
      const hut = new THREE.Group(); hut.position.set(3.6, 0, 5.2); g.add(hut);
      const boards = canvas(128, 128, (c, w, h) => { c.fillStyle = '#7a4a2a'; c.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) { c.fillStyle = `rgba(0,0,0,${0.15 + r() * 0.15})`; c.fillRect(0, y, w, 2); c.fillStyle = `rgba(255,220,180,${r() * 0.08})`; c.fillRect(0, y + 2, w, 14); } });
      boards.wrapS = boards.wrapT = THREE.RepeatWrapping; boards.repeat.set(2, 2);
      const planks = new THREE.MeshStandardMaterial({ map: boards, roughness: 0.85, emissive: 0xffffff, emissiveMap: boards, emissiveIntensity: 0.25 });
      const add = (geo, m, px, py, pz) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); hut.add(o); return o; };
      add(new THREE.BoxGeometry(2.2, 2.0, 1.8), planks, 0, 1.0, 0);
      const roofG = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.25, 2.0, -1.0), new THREE.Vector3(1.25, 2.0, -1.0), new THREE.Vector3(0, 2.5, -1.0), new THREE.Vector3(-1.25, 2.0, 1.0), new THREE.Vector3(1.25, 2.0, 1.0), new THREE.Vector3(0, 2.5, 1.0)]);
      roofG.setIndex([0, 2, 1, 3, 4, 5, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 4]); roofG.computeVertexNormals();
      hut.add(new THREE.Mesh(roofG, lit(0xeef3f8, { side: THREE.DoubleSide })));
      add(new THREE.BoxGeometry(0.7, 1.5, 0.04), lit(0x4a2e1a), -0.45, 0.75, -0.92);
      add(new THREE.BoxGeometry(0.42, 0.32, 0.04), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.1, 0.5) }), 0.5, 1.3, -0.92);
      add(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 10), dark, 0.6, 2.6, 0.3);
      k.plan.obstacles.push({ x0: x + 2.45, x1: x + 4.75, z0: z + 4.25, z1: z + 6.15, y0: -0.3, y1: 2.6 });
      // Its neighbours (harbourplan.js L.shanties, where they are solid): the same hut, each turned its own way, a
      // sled's worth of light from the window lying on the ice. All of them together are five meshes.
      const more = L.shanties || [];
      if (more.length) {
        const walls = [], roofs = [], trim = [], panes = [], pools = [], M = new THREE.Matrix4();
        more.forEach((q, i) => {
          M.makeRotationY(q.turn * Math.PI / 2).setPosition(q.x, 0, q.z);
          const put = (list, geo, px, py, pz) => list.push(geo.translate(px, py, pz).applyMatrix4(M));
          put(walls, new THREE.BoxGeometry(2.2, 2.0, 1.8), 0, 1.0, 0); roofs.push(roofG.clone().applyMatrix4(M));
          put(trim, new THREE.BoxGeometry(0.7, 1.5, 0.04), -0.45, 0.75, -0.92); put(trim, new THREE.CylinderGeometry(0.06, 0.06, 0.8, 10), 0.6, 2.6, 0.3);
          put(panes, new THREE.BoxGeometry(0.42, 0.32, 0.04), 0.5, 1.3, -0.92);
          put(pools, new THREE.PlaneGeometry(2.6, 2.2).rotateX(-Math.PI / 2), 0.45, 0.016 + i * 0.001, -2.0);
        });
        const mesh = (list, m) => { const o = new THREE.Mesh(mergeGeometries(list), m); o.matrixAutoUpdate = false; k.group.add(o); return o; };
        mesh(walls, planks); mesh(roofs, lit(0xeef3f8, { side: THREE.DoubleSide })); mesh(trim, lit(0x3a2a1e)); mesh(panes, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.1, 0.5) }));
        mesh(pools, new THREE.MeshBasicMaterial({ map: radial(), color: new THREE.Color(0.34, 0.23, 0.1), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })).renderOrder = 5;
      }
    }
    yield;
    // ---- the fish
    const kit = this.kit = { perch: buildKind('perch'), smelt: buildKind('smelt'), glow: buildKind('glow') };
    void kit;
    // (five perch, two smelt, and one glowing fish, deep down: rare)
    for (let i = 0; i < 8; i++) { const f = new Fish(this.kit, i < 5 ? 'perch' : i < 7 ? 'smelt' : 'glow', r); f.p.set(lerp(wx0 + 0.6, wx1 - 0.6, r()), -0.5 - r() * 1.8, lerp(wz0 + 0.6, wz1 - 0.6, r())); this._pick(f); g.add(f.g); this.fishes.push(f); }
    yield;
    // ---- the line's state: where the rod tip is, how deep the jig, its little hops
    this.depth = 0.6; this.sweep = 0; this.hop = 0; this.hopV = 0; this.tug = 0; this.tension = 0; this.hooked = null; this.phase = 'idle';
    this.tipAt = new THREE.Vector3(); this.jigAt = new THREE.Vector3();
    this._rest();
    this._dom();
    yield* k.ready(g);
  },
  // A new place for a fish to swim to, in its own band of the water.
  _pick(f) { const W = this.W, x = this.at.x, z = this.at.z, r = this.r; f.to.set(lerp(W.x0 - x + 0.5, W.x1 - x - 0.5, r()), f.kind === 'smelt' ? -0.4 - r() * 0.9 : f.kind === 'glow' ? -1.3 - r() * 1.1 : -0.7 - r() * 1.6, lerp(W.z0 - z + 0.5, W.z1 - z - 0.5, r())); f.t = 0; },
  _rest() {},
  _dom() {
    const el = this.el = document.createElement('div'); el.hidden = true;
    el.style.cssText = 'position:fixed;inset:0;z-index:40;touch-action:none;user-select:none;-webkit-user-select:none;color:#f3efe2;font:600 15px/1.35 system-ui,sans-serif';
    const fine = matchMedia('(pointer: fine)').matches, key = k => fine ? `<small style="display:block;font-weight:500;font-size:12px;opacity:.75;margin-top:4px;letter-spacing:0">${k}</small>` : '';
    const panel = 'background:rgba(8,12,20,.66);border:1px solid rgba(240,236,226,.25);border-radius:12px';
    const btn = `position:absolute;bottom:calc(env(safe-area-inset-bottom) + 20px);min-width:116px;padding:12px 18px;${panel};color:inherit;font:700 16px/1 system-ui,sans-serif;letter-spacing:.06em;text-align:center`;
    const arrow = `display:block;width:52px;height:40px;${panel};color:inherit;font:700 18px/1 system-ui,sans-serif`;
    el.innerHTML = ''
      // what to do, step by step; the step you are on is lit
      + `<div data-steps style="position:absolute;left:max(16px,env(safe-area-inset-left));top:calc(env(safe-area-inset-top) + 16px);padding:10px 14px;${panel};max-width:min(62vw,330px)">`
      + `<div data-count style="font-size:13px;letter-spacing:.08em;opacity:.85;margin-bottom:6px"></div>`
      + `<div data-s="1">1 · Lower the jig to a fish${fine ? ' <small style="opacity:.7">(W / S)</small>' : ' <small style="opacity:.7">(▲ ▼)</small>'}</div>`
      + `<div data-s="2">2 · Jiggle to tempt it${fine ? ' <small style="opacity:.7">(Space)</small>' : ''}</div>`
      + `<div data-s="3">3 · Big tug and a <b>!</b> means YANK${fine ? ' <small style="opacity:.7">(E)</small>' : ''}</div></div>`
      + '<div data-t style="position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom) + 92px);transform:translateX(-50%);padding:7px 14px;border-radius:10px;background:rgba(8,12,20,.6);text-align:center;max-width:80vw"></div>'
      + '<div data-bang hidden style="position:absolute;left:50%;top:36%;transform:translate(-50%,-50%);font:900 96px/1 system-ui,sans-serif;color:#ffd23a;text-shadow:0 0 18px rgba(0,0,0,.6),0 4px 0 #a2410e">!</div>'
      // the fish finder: depth down the side, the jig and every fish on it
      + `<div style="position:absolute;right:max(16px,env(safe-area-inset-right));top:calc(env(safe-area-inset-top) + 64px);padding:8px;${panel};text-align:center">`
      + '<div style="font-size:11px;letter-spacing:.14em;opacity:.8;margin-bottom:4px">SONAR</div><canvas data-sonar width="96" height="220" style="display:block;width:96px;height:220px;border-radius:6px"></canvas>'
      + `<div style="display:flex;gap:6px;justify-content:center;margin-top:6px"><button data-up style="${arrow}">▲</button><button data-down style="${arrow}">▼</button></div></div>`
      + `<button data-jig style="${btn};left:max(16px,env(safe-area-inset-left))">JIGGLE${key('Space')}</button>`
      + `<button data-yank style="${btn};right:max(16px,env(safe-area-inset-right))">YANK${key('E')}</button>`
      + `<button data-leave style="position:absolute;right:max(16px,env(safe-area-inset-right));top:calc(env(safe-area-inset-top) + 16px);padding:7px 14px;border-radius:10px;border:0;background:rgba(240,236,226,.92);color:#16202c;font:600 14px system-ui,sans-serif">Leave${fine ? ' · Esc' : ''}</button>`;
    document.body.append(el);
    this.txt = el.querySelector('[data-t]'); this.bang = el.querySelector('[data-bang]'); this.count = el.querySelector('[data-count]');
    this.stepEls = [...el.querySelectorAll('[data-s]')]; this.sonar = el.querySelector('[data-sonar]').getContext('2d'); this.yankBtn = el.querySelector('[data-yank]');
    this.keys = new Set(); this.hold = 0;
    let drag = null;
    // (No preventDefault on a pointerdown: it would cancel the focus a click gives, and in itch's frame the keys would never arrive. Nothing is lost by it: style.css already stops text being selected and the page being dragged, for every element.)
    el.addEventListener('pointerdown', e => {
      if (e.target.closest('[data-leave]')) return this.close();
      if (e.target.closest('[data-jig]')) return this.jiggle();
      if (e.target.closest('[data-yank]')) return this.yank();
      const ud = e.target.closest('[data-up]') ? -1 : e.target.closest('[data-down]') ? 1 : 0;
      if (ud) { this.hold = ud; const up = () => { this.hold = 0; removeEventListener('pointerup', up); removeEventListener('pointercancel', up); }; addEventListener('pointerup', up); addEventListener('pointercancel', up); return; }
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, d0: this.depth, s0: this.sweep }; el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
      if (this.phase === 'fish') { this.depth = Math.max(0.15, Math.min(this.DEEP - 0.15, drag.d0 + dy / innerHeight * 3.2)); this.sweep = Math.max(-1, Math.min(1, drag.s0 + dx / innerWidth * 2.4)); }
    });
    const end = e => { if (!drag || e.pointerId !== drag.id) return; if (drag.moved < 8 && performance.now() - drag.t < 350) (this.fishes.some(q => q.state === 'bite') ? this.yank() : this.jiggle()); drag = null; };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    addEventListener('keydown', e => {
      if (!this.on) return;
      const c = e.code; e.preventDefault(); e.stopPropagation();
      if (c === 'Escape') return this.close();
      if (e.repeat) return;
      this.keys.add(c);
      if (c === 'Space') this.jiggle();
      if (c === 'KeyE' || c === 'Enter') this.yank();
    }, true);
    addEventListener('keyup', e => { if (this.on) this.keys.delete(e.code); }, true);
  },
  // Which of the three steps you are on, and the tally.
  _steps() {
    const biting = this.fishes.some(q => q.state === 'bite'), keen = this.fishes.some(q => q.state === 'come' || q.state === 'nose'), near = this.fishes.some(q => Math.abs(q.p.y - this.jigAt.y) < 0.35);
    const on = biting || this.phase === 'reel' ? 3 : keen || near ? 2 : 1;
    this.stepEls.forEach((d, i) => { d.style.opacity = i + 1 === on ? '1' : '.45'; d.style.color = i + 1 === on ? '#ffd98a' : ''; });
    this.count.textContent = this.caught >= 3 ? `FISH ${this.caught} · SECRET FOUND` : `FISH ${this.caught} OF 3`;
    this.bang.hidden = !biting; this.yankBtn.style.background = biting ? 'rgba(210,140,20,.92)' : 'rgba(8,12,20,.66)';
  },
  // The fish finder: a column of water, the ice at the top, the bottom at the foot; the jig in orange, fish as green arcs,
  // brighter the nearer they are to it. A fish level with the jig lights up.
  _drawSonar() {
    const c = this.sonar, w = 96, h = 220, top = 8, bot = h - 10, Y = d => top + (d / this.DEEP) * (bot - top);
    c.fillStyle = '#04140f'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#9fc7d8'; c.fillRect(0, 0, w, top - 2);
    c.fillStyle = '#3a3324'; c.fillRect(0, bot, w, h - bot);
    c.font = '9px system-ui,sans-serif'; c.fillStyle = 'rgba(160,220,190,.6)'; c.strokeStyle = 'rgba(160,220,190,.15)';
    for (let m = 0.5; m < this.DEEP; m += 0.5) { const y = Y(m); c.beginPath(); c.moveTo(18, y); c.lineTo(w, y); c.stroke(); c.fillText(m.toFixed(1), 1, y + 3); }
    const jd = -this.jigAt.y;
    for (const f of this.fishes) {
      if (f.state === 'landed') continue;
      const d = -f.p.y, horiz = Math.hypot(f.p.x - this.jigAt.x, f.p.z - this.jigAt.z), level = Math.abs(d - jd) < 0.3;
      const x = 24 + Math.min(1, horiz / 4) * 60, a = Math.max(0.35, 1 - horiz / 5), y = Y(d);
      c.strokeStyle = level ? `rgba(255,220,90,${a})` : `rgba(90,230,130,${a})`; c.lineWidth = level ? 3 : 2.2;
      c.beginPath(); c.arc(x, y + 4, 7, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    }
    const y = Y(jd); c.fillStyle = '#ff8a2a'; c.fillRect(18, y - 1.5, w - 18, 3); c.beginPath(); c.arc(22, y, 4, 0, 7); c.fill();
  },
  near(v, k) {
    if (this.on || !this.at || !k.close(this.at, 1.4, 1)) return null;
    return { verb: 'FISH', hint: 'A hole in the ice, and a rod. Fish?', act: () => this.open() };
  },
  open() {
    const k = this.k; this.on = true; k.G.state = 'paused'; this.el.hidden = false; this.keys.clear(); this.pull = false;
    this.hid = k.G.vehicle.group.visible; k.G.vehicle.group.visible = false; if (k.G.car.shadow) k.G.car.shadow.visible = false;
    // Over the hole, a little to one side, looking down through the ice into the water.
    k.stage.enter({ x: this.at.x, y: -0.7, z: this.at.z + 0.45, nx: 0, ny: 0.8, nz: -0.6, w: 3.0, h: 2.6, up: [0, 0, 1] }, { fill: 0.95 });
    this.phase = 'fish'; this.depth = 0.6; this.sweep = 0; this.tension = 0; this.hooked = null; this.hold = 0;
    this.say(this.caught >= 3 ? 'Three in the bucket. Fish on if you like.' : 'Watch the sonar: take the orange jig down to a green fish.');
    this.last = performance.now(); const loop = t => { if (!this.on) return; this.tick(Math.min(0.05, (t - this.last) / 1000), true); this.last = t; requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  },
  close() {
    if (!this.on) return; const k = this.k; this.on = false; this.el.hidden = true;
    if (this.hooked) { this.hooked.state = 'flee'; this.hooked = null; }
    this.phase = 'idle'; this.depth = 0.6; this.sweep = 0; this._rest();
    k.G.vehicle.group.visible = this.hid !== false; if (k.G.vehicle === k.G.car) k.G.car.shadow.visible = true; k.resume();
  },
  say(t) { this.txt.textContent = t; },
  jiggle() {
    if (this.phase !== 'fish') return;
    this.hopV = 0.55; this.k.synth.note(1400 + Math.random() * 300, 0.04, { type: 'triangle', vol: 0.015 });
    // Fish nearby notice; a fish too close and jiggled at too often grows wary.
    for (const f of this.fishes) { const d = f.p.distanceTo(this.jigAt); if (d < 2.6 && f.state === 'cruise' && f.wary < 1) { f.state = 'come'; f.t = 0; } }
  },
  yank() {
    if (this.phase !== 'fish') return;
    const f = this.fishes.find(q => q.state === 'bite');
    this.rodKick = 1; this.k.synth.noise(0.12, { vol: 0.05, lp: 1800 });
    if (f) {
      for (const q of this.fishes) if (q !== f && (q.state === 'nose' || q.state === 'bite' || q.state === 'come')) { q.state = 'flee'; q.t = 0; }
      f.state = 'hooked'; this.hooked = f; this.phase = 'reel'; this.say('Got it! Reeling in…'); this.k.synth.chime([523, 784], { gap: 0.06, dur: 0.3, vol: 0.04 });
    } else {
      // Yanked on a nibble: that one is off. (On nothing at all, no harm done.)
      let scared = false; for (const q of this.fishes) if (q.state === 'nose') { q.state = 'flee'; q.t = 0; q.wary = 1.2; scared = true; }
      this.say(scared ? 'Too soon: that was a nibble. Wait for the big tug and the !' : 'Nothing on yet. Wait for the !');
    }
  },
  active(k) { this.k = k; return !!this.at && (this.on || k.close(this.at, 40, 6)); },
  update(dt, k) { if (k.close(this.at, 7, 2)) k.once('icefish', 'Clear ice here. Fish under it.', 4); if (!this.on) this.tick(dt, false); },
  tick(dt, playing) {
    const T = (this.clock = (this.clock || 0) + dt), r = this.r;
    this.weedU.uT.value = T;
    // ---- the rod and the jig
    if (playing) {
      const kx = (this.keys.has('ArrowRight') || this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('ArrowLeft') || this.keys.has('KeyA') ? 1 : 0);
      const ky = (this.keys.has('ArrowDown') || this.keys.has('KeyS') ? 1 : 0) - (this.keys.has('ArrowUp') || this.keys.has('KeyW') ? 1 : 0) + this.hold;
      this.sweep = Math.max(-1, Math.min(1, this.sweep + kx * dt * 1.2)); if (this.phase === 'fish') this.depth = Math.max(0.15, Math.min(this.DEEP - 0.15, this.depth + ky * dt * 0.9));
    }
    this.hop += this.hopV * dt; this.hopV -= dt * 4.2; if (this.hop < 0) { this.hop = 0; this.hopV = 0; }
    this.rodKick = Math.max(0, (this.rodKick || 0) - dt * 3);
    const held = playing, sw = this.sweep;
    // What the rod carries: the jig's weight, a nibble or a bite, a fish coming up; a yank whips it up for a moment.
    const load = held ? Math.max(0, Math.min(1.4, 0.18 + this.tug * 0.75 + (this.phase === 'reel' ? 0.55 + Math.sin(T * 20) * 0.12 : 0) - this.rodKick * 0.5)) : 0.04;
    this._pose(held, sw, load, T);
    // The jig hangs straight down from the tip, through the hole (or just under the tip, the rod in its holder).
    const tip = this.tipAt, sway = Math.sin(T * 0.7) * 0.012;
    const jy = held ? -this.depth + this.hop * 0.25 - this.tug * 0.05 : tip.y - 0.12;
    this.jigAt.set(tip.x + sway, jy, tip.z + sway * 0.5); this.jig.position.copy(this.jigAt); this.jig.rotation.z = Math.sin(T * 2) * 0.2 + this.hopV * 0.6;
    this.jig.visible = held || !this.hooked; this.jigGlow.visible = held;
    // The line: off the reel's spool, through each guide, out of the tip-top, down to the jig.
    const a = this.lineGeo.attributes.position, L = this.linePts; for (let i = 0; i < 5; i++) a.setXYZ(i, L[i].x, L[i].y, L[i].z); for (const i of [5, 6]) a.setXYZ(i, this.jigAt.x, this.jigAt.y + 0.012, this.jigAt.z); a.needsUpdate = true;
    this.tug = Math.max(0, this.tug - dt * 2.5);
    // ---- the fish
    const W = this.W, ox = this.at.x, oz = this.at.z, lo = { x: W.x0 - ox + 0.3, X: W.x1 - ox - 0.3, z: W.z0 - oz + 0.3, Z: W.z1 - oz - 0.3 };
    for (const f of this.fishes) {
      f.t += dt; f.wary = Math.max(0, f.wary - dt * 0.05);
      let want = f.to, speed = 0.18 + f.mood * 0.12, swim = 1;
      if (f.state === 'cruise') {
        if (f.p.distanceTo(f.to) < 0.3 || f.t > 12) this._pick(f);
        // a fish at the jig's depth, not far off, comes to look at it by itself sooner or later
        if (held && this.phase === 'fish' && f.wary < 0.8 && Math.abs(f.p.y - this.jigAt.y) < 0.45 && f.p.distanceTo(this.jigAt) < 2.2 && r() < dt * 0.35) { f.state = 'come'; f.t = 0; }
      } else if (f.state === 'come') {
        want = this._v1 || (this._v1 = new THREE.Vector3()); want.copy(this.jigAt); want.x += Math.cos(f.yaw) * 0.12; want.z -= Math.sin(f.yaw) * 0.12; speed = 0.26;
        if (!held || this.phase !== 'fish' || f.t > 14 || this.fishes.some(q => q !== f && (q.state === 'nose' || q.state === 'bite'))) { f.state = 'cruise'; this._pick(f); }
        else if (f.p.distanceTo(this.jigAt) < (f.kind === 'glow' ? 0.3 : 0.17)) { if (f.kind === 'glow') { f.state = 'circle'; f.t = 0; f.ring = Math.atan2(f.p.z - this.jigAt.z, f.p.x - this.jigAt.x); } else { f.state = 'nose'; f.t = 0; f.nibbles = 1 + Math.floor(r() * 3); f.next = 0.6 + r() * 0.6; } }
      } else if (f.state === 'circle') {
        // the glowing one looks before it takes: twice round the jig, slowly, and only then a nibble
        f.ring += dt * 2.4; want = this._v1 || (this._v1 = new THREE.Vector3()); want.set(this.jigAt.x + Math.cos(f.ring) * 0.24, this.jigAt.y, this.jigAt.z + Math.sin(f.ring) * 0.24); speed = 0.34;
        if (f.t > 5.2) { f.state = 'nose'; f.t = 0; f.nibbles = Math.floor(r() * 2); f.next = 0.5 + r() * 0.5; if (playing) this.say('It circles the jig… then comes in.'); }
        if (!held || this.phase !== 'fish' || f.wary > 1) { f.state = 'flee'; f.t = 0; }
      } else if (f.state === 'nose') {
        // one, two or three little nibbles (the tip twitches, a tick), then it takes it
        want = this.jigAt; speed = 0.08; swim = 0.5;
        if (f.t > f.next) {
          if (f.nibbles > 0) { f.nibbles--; f.next = f.t + 0.7 + r() * 0.9; this.tug = Math.max(this.tug, 0.35); this.k.synth.note(900, 0.05, { type: 'triangle', vol: 0.03 }); if (playing) this.say('Nibble… not yet.'); }
          else { f.state = 'bite'; f.t = 0; this.tug = 1; this.k.synth.noise(0.22, { vol: 0.08, lp: 900 }); this.k.synth.note(220, 0.18, { type: 'sine', vol: 0.06 }); if (playing) this.say('YANK!'); }
        }
        if (!held || f.wary > 1 || this.phase !== 'fish') { f.state = 'flee'; f.t = 0; }
      } else if (f.state === 'bite') {
        want = this.jigAt; speed = 0.05; this.tug = Math.max(this.tug, 0.85 + Math.sin(f.t * 30) * 0.15);
        if (f.t > 1.25 || this.phase !== 'fish') { f.state = 'flee'; f.t = 0; f.wary = 0.6; if (playing && this.phase === 'fish') this.say('Missed it. Yank as soon as the ! shows.'); }
      } else if (f.state === 'hooked') {
        // Hooked: up it comes, kicking all the way.
        this.depth = Math.max(0, this.depth - dt * 1.1); this.tug = 0.7 + Math.sin(T * 20) * 0.2;
        f.p.copy(this.jigAt); f.p.x += Math.sin(T * 7) * 0.05; f.yaw = Math.PI / 2 + Math.sin(T * 9) * 0.6; f.pitch = 1.1;
        f.u.uAmp.value = 0.28; f.u.uT.value += dt * 24;
        if (this.depth < 0.12) this._land(f);
        this._place(f);
        continue;
      } else if (f.state === 'flee') { want = this._v2 || (this._v2 = new THREE.Vector3()); want.set(f.p.x * 3, -this.DEEP + 0.4, f.p.z * 3); speed = 0.8; swim = 2.2; if (f.t > 2.5) { f.state = 'cruise'; this._pick(f); } }
      else if (f.state === 'landed') { this._flop(f, dt); continue; }
      // steer towards where it wants to be: turning, rising and sinking gently, never leaving the water
      const dx = want.x - f.p.x, dy = want.y - f.p.y, dz = want.z - f.p.z, d = Math.hypot(dx, dz) || 1e-6;
      const yawTo = Math.atan2(-dz, dx); let dyaw = yawTo - f.yaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw)); f.yaw += dyaw * Math.min(1, dt * (f.state === 'flee' ? 6 : 2.2));
      const sp = speed * Math.min(1, d / 0.25 + 0.15);
      f.p.x += Math.cos(f.yaw) * sp * dt; f.p.z -= Math.sin(f.yaw) * sp * dt; f.p.y += Math.max(-0.25, Math.min(0.25, dy)) * dt * 0.8;
      f.p.x = Math.max(lo.x, Math.min(lo.X, f.p.x)); f.p.z = Math.max(lo.z, Math.min(lo.Z, f.p.z)); f.p.y = Math.max(-this.DEEP + 0.15, Math.min(-0.22, f.p.y));
      f.pitch += (Math.max(-0.4, Math.min(0.4, dy * 1.5)) - f.pitch) * Math.min(1, dt * 2);
      f.u.uAmp.value += ((0.08 + sp * 0.5 * swim) - f.u.uAmp.value) * Math.min(1, dt * 3); f.u.uT.value += dt * (4 + sp * 22 * swim);
      this._place(f);
    }
    // ---- the hole's water stirs whenever the line moves in it
    const rp = this.ripple; if ((this.hopV > 0.4 || this.tug > 0.6 || this.phase === 'reel') && rp.material.opacity < 0.1) { rp.scale.setScalar(1); rp.material.opacity = 0.7; }
    rp.scale.multiplyScalar(1 + dt * 1.8); if (rp.scale.x > 4) rp.material.opacity = 0; rp.material.opacity = Math.max(0, rp.material.opacity - dt * 0.8);

    if (playing) { this._steps(); this._drawSonar(); }
  },
  // Where the rod is and how far it bends. The blank is a row of short tubes along a curve that droops more towards the
  // tip (as a rod loaded at its end does); the guides sit under it, square to it.
  _pose(held, sw, load, T) {
    const R = this.rod, B = this._B || (this._B = new THREE.Vector3()), A = this._A || (this._A = new THREE.Vector3()), up = this._up || (this._up = new THREE.Vector3(0, 1, 0));
    if (held) { B.set(-0.56 + sw * 0.14, 0.42 + this.rodKick * 0.04, 0.05); A.set(0.02 + sw * 0.15, 0.5 + this.rodKick * 0.24, 0); }      // in from the side, so its bend and the line's drop are seen
    else { B.set(-0.6, 0.2, 0.16); A.set(-0.35, 0.5, 0.5); }
    const X = this._X || (this._X = new THREE.Vector3()), Y = this._Y || (this._Y = new THREE.Vector3()), Z = this._Z || (this._Z = new THREE.Vector3());
    X.subVectors(A, B).normalize(); Z.crossVectors(X, up).normalize(); Y.crossVectors(Z, X);
    R.matrix.makeBasis(X, Y, Z).setPosition(B); R.matrixWorldNeedsUpdate = true;
    const L = this.ROD, P = (u, out) => out.set(u * L * (1 - 0.12 * load * load * u), -load * L * 0.42 * u * u, 0);
    const p0 = this._p0 || (this._p0 = new THREE.Vector3()), p1 = this._p1 || (this._p1 = new THREE.Vector3()), d = this._d || (this._d = new THREE.Vector3()), Q = this._Q || (this._Q = new THREE.Quaternion()), Yax = this._Ya || (this._Ya = new THREE.Vector3(0, 1, 0)), Zax = this._Za || (this._Za = new THREE.Vector3(0, 0, 1));
    for (let i = 0; i < this.SEGS; i++) {
      const u0 = i / this.SEGS, u1 = (i + 1) / this.SEGS, m = this.segs[i], r = lerp(0.0055, 0.0018, (u0 + u1) / 2);
      P(u0, p0); P(u1, p1); d.subVectors(p1, p0); const len = d.length(); d.normalize();
      m.position.copy(p0); m.quaternion.setFromUnitVectors(Yax, d); m.scale.set(r, len * 1.02, r);
    }
    // guides, and the points the line passes through in the rod's own frame
    const pts = this.linePts || (this.linePts = Array.from({ length: 5 }, () => new THREE.Vector3()));
    pts[0].set(0.012, -0.034, 0);
    this.guides.forEach((g, i) => {
      const u = g.userData.u, r = g.userData.r; P(u, p0); P(Math.min(1, u + 0.01), p1); d.subVectors(p1, p0).normalize(); if (u >= 1) { P(0.99, p1); d.subVectors(p0, p1).normalize(); }
      const nx = -d.y, ny = d.x;                                       // square to the blank, below it
      g.position.set(p0.x + nx * (u >= 1 ? 0 : 0.011), p0.y - Math.abs(ny) * (u >= 1 ? 0 : 0.011), 0); g.quaternion.setFromUnitVectors(Zax, d); g.scale.setScalar(r);
      pts[i + 1].copy(g.position);
    });
    P(1, p0); this.tipBall.position.copy(p0);
    R.updateMatrixWorld(true);
    for (const p of pts) p.applyMatrix4(R.matrix);
    this.tipAt.copy(pts[4]);
  },
  _place(f) { f.g.position.copy(f.p); f.g.rotation.set(0, f.yaw, 0); f.g.rotateZ(f.pitch); },
  // Out through the hole, onto the ice, and a few flaps before it goes in the bucket.
  _land(f) {
    const k = this.k; f.state = 'landed'; f.t = 0; this.hooked = null; this.phase = 'fish'; this.depth = 0.6;
    f.u.uAmp.value = 0.35; f.land = { from: new THREE.Vector3(0, 0.05, 0), to: new THREE.Vector3(0.25 + this.r() * 0.15, 0.03, -0.15 - this.r() * 0.1) };
    this.caught++; k.chips(10); k.synth.noise(0.25, { vol: 0.06, lp: 2600 }); k.synth.chime([660, 880, 1046], { gap: 0.08, dur: 0.6 });
    const name = f.kind === 'perch' ? 'A yellow perch' : f.kind === 'glow' ? 'A glowing fish' : 'A smelt', cm = Math.round(f.len * 100);
    if (f.kind === 'glow') { glowCaught(glowCaught() + 1); k.synth.chime([1046, 1318, 1568], { gap: 0.1, dur: 0.9, vol: 0.035 }); }      // (kept: the Moon remembers it, src/moonbase.js)
    const more = f.kind === 'glow' ? ' Nobody has ever caught one of these here.' : '';
    if (this.caught === 3) { this.say(`${name}, ${cm} cm.${more} Three! +10 chips.`); if (k.find('icefish')) k.callout('ICE FISHING'); }
    else this.say(`${name}, ${cm} cm.${more} +10 chips.`);
  },
  _flop(f, dt) {
    const L = f.land, t = Math.min(1, f.t / 0.7);
    if (f.t < 0.7) { f.p.lerpVectors(L.from, L.to, t); f.p.y = 0.05 + Math.sin(t * Math.PI) * 0.35; f.yaw += dt * 9; f.pitch = Math.sin(f.t * 12) * 0.8; }
    else if (f.t < 2.6) { f.p.copy(L.to); f.p.y = 0.03 + Math.abs(Math.sin(f.t * 7)) * 0.05 * (2.6 - f.t); f.pitch = 0; f.g.rotation.x = Math.PI / 2; f.u.uT.value += dt * 20; }
    else {
      // into the bucket, and a new fish takes its place in the water
      const i = this.fishes.indexOf(f); if (i >= 0) this.fishes.splice(i, 1);
      this.g.remove(f.g); this.bucket.add(f.g); const n = this.bucketed.length; this.bucketed.push(f);
      f.g.position.set(Math.cos(n * 2.1) * 0.035, 0.15, Math.sin(n * 2.1) * 0.035); f.g.rotation.set(0, n * 1.4, Math.PI / 2 - 0.2); f.g.scale.multiplyScalar(0.7); f.u.uAmp.value = 0.02;
      const q = this.r(), nf = new Fish(this.kit, q < 0.08 ? 'glow' : q < 0.72 ? 'perch' : 'smelt', this.r); nf.p.set(this.W.x0 - this.at.x + 1, -this.DEEP + 0.4, this.W.z0 - this.at.z + 1); this._pick(nf); this.g.add(nf.g); this.fishes.push(nf);
      return;
    }
    f.g.position.copy(f.p); if (f.t < 0.7) { f.g.rotation.set(0, f.yaw, 0); f.g.rotateZ(f.pitch); } else f.g.rotation.set(Math.PI / 2, f.yaw, 0);
  },
  spots() { return this.at ? [{ kind: 'secret', id: 'icefish', name: 'Ice fishing (three fish)', ...this.at }] : []; },
  reset() { for (const f of this.bucketed) this.bucket.remove(f.g); this.bucketed = []; this.caught = 0; glowCaught(0); },
});

let _radial = null;
function radial() {
  if (_radial) return _radial;
  _radial = canvas(64, 64, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  return _radial;
}
