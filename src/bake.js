// What never moves is drawn as one.   (Off with ?nobake in the address; ?nospeck leaves what is too small to see drawn.)
//
// The world is built of thousands of little meshes (a lamp post is a pole, a cap and a glass; a bench is six planks and
// two irons), and each is a draw call of its own. A phone pays for every one of them in the processor, whatever its size
// on the screen: out of doors, at the steps, over twelve hundred a frame. So, as the world is built (behind the loading
// bar, and as each of a phone's park features is built: src/features.js k.ready), the pieces are copied into one mesh for
// each look in each place, and the pieces themselves are no longer drawn. Nothing else about them changes: they stay where they are in the scene, and every feature that holds one
// can still move it, hide it, recolour it or take it away.
//
// A look: pieces of one material go in together, drawn with that very material. Pieces of three.js's plain materials
// (standard, Lambert, basic) that differ only in their colour, glow, roughness and metalness go in together as well: that
// batch has a material of its own, the same in every other way, with those carried in its vertices (each piece gets what
// its own material's uniforms gave it), and the guard watches every one of the pieces' materials for any change.
//
// THE RULE is the same as the culling's (src/visible.js): when in doubt, leave it alone. A piece is only put in with
// others if it is plainly fixed (visible.js's fixed()), opaque, on show, and of a known room or 24 m square (visible.js's
// bins: never across two, so that the culling still works on the pieces, and never anything too big for one); drawn by one
// of three.js's own materials, or by one with something of the game's own in its shader that is plainly reckoned in the
// world, the view or the screen (shaderSafe, below). Never a wall, a floor, a roof or the ground (what the culling table
// counts on to hide things, by its fingerprint), and never a work of art. Pieces are put together only with others of the
// same feature (or of the museum's same part of the world), under the deepest group they all hang from, so that a feature
// that hides or moves itself takes its batch with it.
//
// AND THE GUARD: every frame, before anything is drawn, every piece in a batch is looked at: has it moved, turned, been
// hidden (in what it hangs from, as has anything between it and its batch), been given another material or shape, had its
// vertices set again, or been taken out of the scene; has its material been changed? Then its batch is broken up at once,
// in that frame, and its pieces are drawn as they were; what changed is never batched again, and the rest are batched
// afresh once they have stood still again. (A piece not drawn is on no layer at all: src/stream.js's applyLayers, which the streamer and the
// culling both go through, keeps it so. The culling files it as it would have, filing(), so that it is culled as before if
// it is ever drawn again; the streamer, main.js, leaves it alone.)
//
// AND WHAT IS TOO SMALL TO SEE: a fixed thing (or a batch) that, from where the camera is, would come out under three quarters
// of a pixel across on the screen (by the ball it fits in, which is bigger than it is) is not drawn until the camera comes
// nearer, but for in the floor's reflection (which is smeared, and takes a little of even a speck: src/stream.js). Not what
// glows (a speck of light still blooms), not a wall, not a work of art; and anything that moves or has its shape written
// again is drawn again and left alone from then on.
//
// Nothing is batched in the opening or in play but a park feature just built, before it is shown and before its shaders
// are warmed: so the warming (main.js prepare, src/flywarm.js, k.ready) and the culling table see the batches, not the
// pieces. What turns out to move is undone by the guard, and stays as it was built.

import * as THREE from 'three';
import { fixed, boxOf, wallLike, loose, Places } from './visible.js';
import { applyLayers } from './stream.js';

const Q = typeof location !== 'undefined' ? location.search : '', OFF = /[?&]nobake\b/.test(Q), NOSPECK = OFF || /[?&]nospeck\b/.test(Q);      // (?nospeck: batches, but everything drawn however small)
const NOOPC = THREE.Material.prototype.onBeforeCompile, STATIC = 35044;
const SPECK = 0.75;                // pixels across (its ball's), under which a thing is not drawn
// Does it glow? (Too bright to leave out however small: a speck of light still blooms.)
const bright = m => {      // (the glow's threshold is 1: what comes out brighter than that blooms. A plain material's own light is its colour; any other's, its glow)
  if (m.isSpriteMaterial || m.isPointsMaterial || m.isLineBasicMaterial || m.emissiveMap || m.map && m.isMeshBasicMaterial) return true;
  if (m.isMeshBasicMaterial) return Math.max(m.color.r, m.color.g, m.color.b) > 0.8;
  const e = m.emissive; return !!e && Math.max(e.r, e.g, e.b) * (m.emissiveIntensity == null ? 1 : m.emissiveIntensity) > 0.8;
};

// ---- one material for a look: what differs from piece to piece, carried in the vertices ----
const CARRIED = { MeshStandardMaterial: ['color', 'emissive', 'emissiveIntensity', 'roughness', 'metalness'], MeshLambertMaterial: ['color', 'emissive', 'emissiveIntensity'], MeshBasicMaterial: ['color'] };
const SKIPKEYS = new Set(['uuid', 'name', 'id', 'version', 'userData', 'uniformsGroups']);
const CH = THREE.ShaderChunk, CAN = !!(CH && /float roughnessFactor = roughness;/.test(CH.roughnessmap_fragment) && /float metalnessFactor = metalness;/.test(CH.metalnessmap_fragment));
/** A material's look less what a batch can carry in its vertices ('' if it cannot be carried so). */
function lookOf(m) {
  const carried = CAN && !m.vertexColors && CARRIED[m.type] && Object.getPrototypeOf(m) === THREE[m.type].prototype ? CARRIED[m.type] : null;
  if (!carried || m.onBeforeCompile !== NOOPC) return '';
  let s = m.type;
  for (const k of Object.keys(m).sort()) {
    if (SKIPKEYS.has(k) || carried.includes(k) || k[0] === '_') continue;
    const v = m[k];
    if (typeof v === 'function') return '';
    if (v == null || typeof v !== 'object') s += '|' + k + ':' + v;
    else if (v.isColor) s += '|' + k + ':' + v.r + ',' + v.g + ',' + v.b;
    else if (v.isTexture) s += '|' + k + ':' + v.uuid;
    else if (v.isVector2 || v.isVector3 || v.isEuler) s += '|' + k + ':' + v.toArray();
    else if (Array.isArray(v) && !v.length) s += '|' + k + ':[]';
    else if (k === 'defines') s += '|defines:' + JSON.stringify(v);
    else return '';
  }
  return s;
}
// the vertices' share of what a piece's own material gave it (as three.js hands them to the shader: the glow times its strength)
const carry = m => { const e = m.emissive, k = m.emissiveIntensity == null ? 1 : m.emissiveIntensity; return [m.color.r, m.color.g, m.color.b, e ? e.r * k : 0, e ? e.g * k : 0, e ? e.b * k : 0, m.roughness == null ? 1 : m.roughness, m.metalness == null ? 0 : m.metalness]; };
// and what the guard looks at on each of those materials: any change, and the batch is undone
const snap = m => { const c = m.color, e = m.emissive; return { m, v: m.version, cr: c.r, cg: c.g, cb: c.b, er: e ? e.r : 0, eg: e ? e.g : 0, eb: e ? e.b : 0, k: m.emissiveIntensity, r: m.roughness, t: m.metalness, o: m.opacity, tr: m.transparent, vi: m.visible, map: m.map, em: m.emissiveMap, side: m.side }; };
const same = s => { const m = s.m, c = m.color, e = m.emissive; return m.version === s.v && c.r === s.cr && c.g === s.cg && c.b === s.cb && (!e || (e.r === s.er && e.g === s.eg && e.b === s.eb)) && m.emissiveIntensity === s.k && m.roughness === s.r && m.metalness === s.t && m.opacity === s.o && m.transparent === s.tr && m.visible === s.vi && m.map === s.map && m.emissiveMap === s.em && m.side === s.side; };      // (the colours' own numbers: getHex() would work each out in sRGB, every frame)
function lookMaterial(m0) {
  const m = m0.clone(); m.color.setRGB(1, 1, 1); m.vertexColors = true;      // (white, times each vertex's colour: the piece's own colour exactly)
  const std = m.type === 'MeshStandardMaterial', lit = !!m.emissive;
  m.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 bakeE; varying vec3 vBakeE;' + (std ? '\nattribute vec2 bakeRM; varying vec2 vBakeRM;' : ''))
      .replace('#include <color_vertex>', '#include <color_vertex>\n\tvBakeE = bakeE;' + (std ? ' vBakeRM = bakeRM;' : ''));
    let f = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBakeE;' + (std ? '\nvarying vec2 vBakeRM;' : ''));
    if (lit) f = f.replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = vBakeE;');
    if (std) f = f.replace('#include <roughnessmap_fragment>', CH.roughnessmap_fragment.replace('float roughnessFactor = roughness;', 'float roughnessFactor = vBakeRM.x;'))
      .replace('#include <metalnessmap_fragment>', CH.metalnessmap_fragment.replace('float metalnessFactor = metalness;', 'float metalnessFactor = vBakeRM.y;'));
    sh.fragmentShader = f;
  };
  m.customProgramCacheKey = () => 'bake-look';
  return m;
}

// A material with something of the game's own put into its shader may still be batched (with that very material: never one
// of a look) if what it puts in knows nothing of the piece's own space: a batch's vertices are in another space than each
// piece's were, and only what is reckoned in the world (modelMatrix times the vertex), in the view or on the screen comes
// out the same. Read from the hook's own text, and the key it gives its program (the game's helpers chain onto one another
// and write the hook they wrap into that key); anything that cannot be read so is left alone.
const SAFE = new WeakMap(), NOKEY = THREE.Material.prototype.customProgramCacheKey;
const WORLD = [/modelMatrix\s*\*\s*vec4\(\s*transformed\s*,\s*1\.0\s*\)/g, /mat3\(\s*modelMatrix\s*\)\s*\*\s*objectNormal/g, /#include\s*<\w+>/g];
function shaderSafe(m) {
  let ok = SAFE.get(m); if (ok !== undefined) return ok;
  ok = false;
  try {
    const own = String(m.onBeforeCompile), key = m.customProgramCacheKey === NOKEY ? '' : String(m.customProgramCacheKey());
    const chained = /\bprev\b/.test(own), told = /=>|function/.test(key);      // (a hook that wraps another, and whether the key gives the other's text)
    if (!chained || told) {
      let t = own + '\n' + key; for (const re of WORLD) t = t.replace(re, ' ');
      ok = !/\btransformed\b|\bposition\b|\bobjectNormal\b|\bmodelMatrix\b|\bmodelViewMatrix\b|\bnormalMatrix\b|\binstanceMatrix\b|onBeforeRender|userData/.test(t);
    }
  } catch { ok = false; }
  SAFE.set(m, ok); return ok;
}

// Shapes put together into one, each by its matrix: [[geometry, material, matrix]], all with the same attributes and all indexed
// or none. With `look`, each piece's colour, glow, roughness and metalness go in its vertices (for lookMaterial).
const _v = new THREE.Vector3(), _n = new THREE.Matrix3();
function join(parts, look) {
  const g0 = parts[0][0], names = Object.keys(g0.attributes).filter(k => !(look && k === 'color')), indexed = !!g0.index;
  let nv = 0, ni = 0; for (const [g] of parts) { nv += g.attributes.position.count; ni += indexed ? g.index.count : 0; }
  if (nv < 3) return null;
  const out = {}; for (const k of names) { const a = g0.attributes[k]; out[k] = new a.array.constructor(nv * a.itemSize); }
  const index = indexed ? new (nv > 65535 ? Uint32Array : Uint16Array)(ni) : null;
  const col = look ? new Float32Array(nv * 3) : null, emi = look ? new Float32Array(nv * 3) : null, rm = look && parts[0][1].type === 'MeshStandardMaterial' ? new Float32Array(nv * 2) : null;
  const v = _v, N = _n; let vo = 0, io = 0;
  for (const [g, m, M] of parts) {
    const cnt = g.attributes.position.count; N.getNormalMatrix(M); const flip = M.determinant() < 0;
    for (const k of names) {
      const a = g.attributes[k], s = a.itemSize, src = a.array, dst = out[k], base = vo * s;
      if (k === 'position') for (let i = 0; i < cnt; i++) { v.fromBufferAttribute(a, i).applyMatrix4(M); dst[base + i * 3] = v.x; dst[base + i * 3 + 1] = v.y; dst[base + i * 3 + 2] = v.z; }
      else if (k === 'normal') for (let i = 0; i < cnt; i++) { v.fromBufferAttribute(a, i).applyMatrix3(N).normalize(); dst[base + i * 3] = v.x; dst[base + i * 3 + 1] = v.y; dst[base + i * 3 + 2] = v.z; }
      else if (src.length === cnt * s) dst.set(src, base);
      else for (let i = 0; i < cnt * s; i++) dst[base + i] = src[i];
    }
    if (indexed) { const ix = g.index.array, c = g.index.count; if (flip) for (let i = 0; i < c; i += 3) { index[io + i] = ix[i] + vo; index[io + i + 1] = ix[i + 2] + vo; index[io + i + 2] = ix[i + 1] + vo; } else for (let i = 0; i < c; i++) index[io + i] = ix[i] + vo; io += c; }
    else if (flip) for (const k of names) { const s = g.attributes[k].itemSize, d = out[k]; for (let t = vo; t + 2 < vo + cnt; t += 3) for (let j = 0; j < s; j++) { const x = d[(t + 1) * s + j]; d[(t + 1) * s + j] = d[(t + 2) * s + j]; d[(t + 2) * s + j] = x; } }      // (turned inside out by a mirroring: wound the other way, as three.js does for the piece on its own)
    if (look) { const c = carry(m); for (let i = vo; i < vo + cnt; i++) { col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; emi[i * 3] = c[3]; emi[i * 3 + 1] = c[4]; emi[i * 3 + 2] = c[5]; if (rm) { rm[i * 2] = c[6]; rm[i * 2 + 1] = c[7]; } } }
    vo += cnt;
  }
  const geo = new THREE.BufferGeometry();
  for (const k of names) { const a = g0.attributes[k]; geo.setAttribute(k, new THREE.BufferAttribute(out[k], a.itemSize, a.normalized)); }
  if (index) geo.setIndex(new THREE.BufferAttribute(index, 1));
  if (look) { geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('bakeE', new THREE.BufferAttribute(emi, 3)); if (rm) geo.setAttribute('bakeRM', new THREE.BufferAttribute(rm, 2)); }
  geo.computeBoundingBox(); geo.computeBoundingSphere();
  return geo;
}
const LOOKS = new Map();
/** One mesh of the parts of a thing that are never moved apart (a cone's cone, band and foot): [[geometry, material, matrix]], all
 *  with the same attributes and all indexed or none, of one material or of materials of one look. null if they cannot be one.
 *  (Of one look: one shared material for each look, made the first time, the parts' colours in the vertices. For a thing whose
 *  materials are never changed afterwards: nothing watches them.) */
export function joined(parts) {
  if (OFF) return null;      // (?nobake: everything as it was built)
  const mats = [...new Set(parts.map(p => p[1]))], look = mats.length > 1 ? lookOf(mats[0]) : '';
  if (mats.length > 1 && (!look || mats.some(m => lookOf(m) !== look))) return null;
  const sig = g => Object.keys(g.attributes).filter(k => !(look && k === 'color')).sort().map(k => k + g.attributes[k].itemSize + g.attributes[k].array.constructor.name).join() + !!g.index;
  if (parts.some(p => sig(p[0]) !== sig(parts[0][0]))) return null;
  const geo = join(parts, !!look); if (!geo) return null;
  let m = mats[0]; if (look) { m = LOOKS.get(look); if (!m) LOOKS.set(look, m = lookMaterial(mats[0])); }
  return new THREE.Mesh(geo, m);
}

export class Baker {
  /** root: the museum's group. skip(o): never to be batched (the works of art). */
  constructor(root, plan, { skip = () => false } = {}) {
    this.root = root; this.places = new Places(plan); this.skip = skip; this.off = OFF;
    this.batches = []; this.moving = new WeakSet(); this.changing = new WeakSet();
    this.made = 0; this.broken = 0; this.pieces = 0; this.ms = 0; this.onMade = null; this.fresh = false;
    this.specks = []; this._specked = new WeakSet(); this._frames = 0; this._young = 0; this._at = new THREE.Vector3(1e9, 0, 0); this._f = 0; this.hidden = 0; this._sph = new THREE.Sphere();
    this._box = new THREE.Box3();
  }

  /** Batch what is under `top` (the museum's group, behind the loading bar), all at once. Then the culling and the streamer are told. */
  now(top = this.root) { const it = this.steps(top); while (!it.next().done); }
  /** The same a batch at a time, for a feature being built a part at a time (src/features.js k.ready: `yield* G.bake.steps(g)`),
   *  before it is shown, though it is still hidden. */
  *steps(top) {
    if (this.off) return;
    top.updateWorldMatrix(true, true);      // (just built, and never drawn: where everything is worked out)
    const it = this._work(top);
    for (;;) {
      const t0 = performance.now(); let r;
      try { r = it.next(); } catch (e) { console.warn('bake: ' + (e && e.stack || e)); this.off = true; this.undoAll(); return; }
      this.ms += performance.now() - t0;
      if (r.done) { if (r.value && this.onMade) this.onMade(); return; }
      yield;
    }
  }

  _ok(o) { return !this.why(o); }
  /** Why this mesh may not go in a batch ('' if it may). The box is left in this._box. */
  why(o) {
    if (!o.isMesh) return 'not a mesh'; if (o.userData.baked) return 'batched'; if (this.moving.has(o)) return 'seen to change'; if (this.skip(o)) return 'art';
    if (!fixed(o)) return 'not fixed'; if (Array.isArray(o.material)) return 'materials';
    const m = o.material, g = o.geometry;
    if (!m || !m.visible) return 'hidden material'; if (m.transparent || m.transmission > 0 || m.alphaHash) return 'see-through';
    if (m.isShaderMaterial || m.isRawShaderMaterial || (m.onBeforeCompile !== NOOPC && !shaderSafe(m))) return 'own shader';
    if (m.depthWrite === false || m.depthTest === false || m.colorWrite === false || m.wireframe) return 'drawn oddly';
    if (o.layers.mask !== 1 && o.userData.far == null && o.userData.cullMask == null) return 'layers'; if (o.renderOrder) return 'order';
    const dr = g.drawRange; if (dr.start !== 0 || dr.count !== Infinity || Object.keys(g.morphAttributes).length) return 'draw range';
    const pos = g.attributes.position; if (loose(pos) || pos.isInterleavedBufferAttribute || !(pos.array instanceof Float32Array) || pos.itemSize !== 3) return 'positions';
    for (const k in g.attributes) { const a = g.attributes[k]; if (a.isInterleavedBufferAttribute || !a.array || a.usage !== STATIC || k === 'tangent') return 'attribute ' + k; }
    if (g.attributes.normal && !(g.attributes.normal.array instanceof Float32Array)) return 'normals';
    if (g.index && (!g.index.array || g.index.usage !== STATIC)) return 'index';
    const b = this._box; if (!boxOf(o, b)) return 'no box';
    if (wallLike(o, b) && this.places.fabric(b)) return 'wall';      // (one of the walls the culling table may count on: left exactly as it is)
    return '';
  }

  // The unit a thing is batched within: its feature (each has a group of its own under the features' group), or the museum's
  // own part of the world it is in. (null: the museum's group itself.)
  _unit(o) { for (let q = o; q && q !== this.root; q = q.parent) if (q.parent === this.root || (q.parent && q.parent.name === 'features' && q.parent.parent === this.root)) return q; return null; }
  // A look over what is under `top`, sorted into batches; then the batches made.
  *_work(top) {
    const groups = new Map(), b = this._box; let made = 0;
    const stack = [top, true];
    while (stack.length) {
      const shown = stack.pop(), o = stack.pop();      // (each thing comes with whether all it hangs from, up to top, is shown)
      const on = shown && (o === top || o.visible) && !(o !== this.root && this.moving.has(o)) && !o.isLOD;      // (what is hidden now may be shown later, what has been seen to change is left alone, and a tree's levels come and go by distance)
      for (let i = o.children.length - 1; i >= 0; i--) stack.push(o.children[i], on);
      if (on && !this._specked.has(o) && (o.isMesh || o.isLine || o.isPoints || o.isSprite) && !o.userData.baked) this._speck(o);
      if (!on || !this._ok(o)) continue;
      const bin = this.places.binOf(b); if (bin == null) continue;
      const unit = this._unit(o.parent); if (!unit) continue;
      const g = o.geometry, m = o.material, look = this.changing.has(m) ? '' : lookOf(m);
      let att = ''; for (const k of Object.keys(g.attributes).sort()) { if (look && k === 'color') continue; const a = g.attributes[k]; att += k + a.itemSize + a.array.constructor.name + (a.normalized ? 'n' : '') + ','; }
      const key = unit.uuid + '|' + bin + '|' + (look || m.uuid) + '|' + att + (g.index ? 'i' : '') + '|' + o.castShadow + o.receiveShadow;
      let l = groups.get(key); if (!l) groups.set(key, l = { bin, unit, look, top, list: [] }); l.list.push(o);
    }
    for (const grp of groups.values()) {
      if (grp.list.length < 2) continue;
      for (let i = 0; i < grp.list.length; i += 2048) if (this._make(grp, grp.list.slice(i, i + 2048))) made++;
      yield;
    }
    return made > 0;
  }

  // The deepest group that every piece hangs from (at or under its unit).
  _anchor(list, unit) {
    const path = o => { const p = []; for (let q = o.parent; q; q = q.parent) { p.push(q); if (q === unit) break; } return p.reverse(); };
    let a = path(list[0]);
    for (let i = 1; i < list.length && a.length > 1; i++) { const p = path(list[i]); let k = 0; while (k < a.length && k < p.length && a[k] === p[k]) k++; a.length = k; }
    return a[a.length - 1] || unit.parent;
  }

  _make(grp, list) {
    // (looked at again: a frame or two may have gone by since the look over the world, and the batch is made from them as they are now)
    list = list.filter(o => this._ok(o) && this.places.binOf(this._box) === grp.bin); if (list.length < 2) return false;
    const anchor = this._anchor(list, grp.unit); if (!anchor) return false;
    const mats = [...new Set(list.map(o => o.material))], look = mats.length > 1 ? grp.look : '';      // (all of one material: that material itself, shared, and nothing to carry)
    // (each piece by what it hangs from, up to the batch's group: the same matrices the guard keeps watch on, whatever has moved since the world's were worked out)
    const rel = o => { const M = new THREE.Matrix4(); for (let q = o; q && q !== anchor; q = q.parent) M.premultiply(q.matrix); return M; };
    const geo = join(list.map(o => [o.geometry, o.material, rel(o)]), !!look); if (!geo) return false;
    // the batch has to stand in the bin its pieces stand in (it cannot be bigger than they are together, but make sure)
    const box = this._box.copy(geo.boundingBox).applyMatrix4(anchor.matrixWorld); if (this.places.binOf(box) !== grp.bin) { geo.dispose(); return false; }
    const o0 = list[0]; let mat = o0.material; if (look) { mat = LOOKS.get(look); if (!mat) LOOKS.set(look, mat = lookMaterial(o0.material)); }      // (one material for each look, shared by every batch of it)
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = o0.castShadow; mesh.receiveShadow = o0.receiveShadow; mesh.matrixAutoUpdate = false; mesh.userData.batch = true;
    const B = { mesh, anchor, list, top: grp.top, recs: [], between: [], mats: look ? mats.map(snap) : null, dead: false };
    this.batches.push(B); this.made++; this._take(B);
    return !B.dead;
  }

  // The batch is drawn from now on, and its pieces are not.
  _take(B) {
    const list = B.list; B.list = null;      // (looked at once more: the pieces as they are now)
    const shown = o => { for (let q = o; q; q = q.parent) { if (q === B.top) return true; if (!q.visible) return false; } return false; };
    if (!list.every(o => this._ok(o) && shown(o)) || (B.mats && !B.mats.every(same))) { this._undo(B); this.batches = this.batches.filter(q => !q.dead); return; }
    B.anchor.add(B.mesh); B.mesh.updateMatrixWorld(true);      // (only now in the scene: the culling and the streamer take it up as it is)
    // the pieces, as they are now, for the guard; and what lies between each and the batch, which must stay as it is too
    const recs = [], between = new Map();
    for (const o of list) {
      const e = o.matrix.elements, g = o.geometry;      // (where it stands in what it hangs from: the batch hangs from that too, and goes where it goes)
      recs.push({ o, e, x: e[12], y: e[13], z: e[14], t: e[0] + e[5] + e[10] + e[1] + e[6] + e[8], g, m: o.material, p: o.parent, pa: g.attributes.position, pv: g.attributes.position.version, ix: g.index, iv: g.index ? g.index.version : 0 });
      for (let q = o.parent; q && q !== B.anchor; q = q.parent) if (!between.has(q)) { const f = q.matrix.elements; between.set(q, [q, q.parent, f, f[12], f[13], f[14], f[0] + f[5] + f[10] + f[1] + f[6] + f[8]]); }
      o.userData.baked = true; applyLayers(o);
    }
    B.recs = recs; B.between = [...between.values()]; this.pieces += recs.length;
    if (!B.mats || B.mats.every(q => !bright(q.m))) this._speck(B.mesh, true);
  }

  /** Before anything is drawn (and after the world's matrices are brought up to date): has any batched piece changed? Then its batch is undone, now. */
  guard() {
    const L = this.batches; if (!L.length) return;
    let dead = 0;
    for (let i = 0; i < L.length; i++) {
      const B = L[i], R = B.recs; let bad = null;
      if (B.dead) continue;
      if (B.mats) for (let k = 0; k < B.mats.length; k++) if (!same(B.mats[k])) { this.changing.add(B.mats[k].m); bad = B.mats[k].m; break; }
      if (bad) { this._log(B, bad, 'material'); this._undo(B); dead++; continue; }
      for (let k = 0; k < R.length; k++) {
        const r = R[k], o = r.o, e = r.e;
        if (e[12] !== r.x || e[13] !== r.y || e[14] !== r.z || e[0] + e[5] + e[10] + e[1] + e[6] + e[8] !== r.t || !o.visible || o.parent !== r.p || o.geometry !== r.g || o.material !== r.m || r.g.attributes.position !== r.pa || r.pa.version !== r.pv || r.g.index !== r.ix || (r.ix && r.ix.version !== r.iv)) { bad = o; break; }
      }
      if (!bad) { const W = B.between; for (let k = 0; k < W.length; k++) { const w = W[k], q = w[0], f = w[2]; if (!q.visible || q.parent !== w[1] || f[12] !== w[3] || f[13] !== w[4] || f[14] !== w[5] || f[0] + f[5] + f[10] + f[1] + f[6] + f[8] !== w[6]) { bad = q; break; } } }
      if (bad) { this._log(B, bad, bad.isMesh ? 'piece' : 'group'); this.moving.add(bad); this._undo(B); dead++; }
    }
    if (dead) { this.batches = L.filter(B => !B.dead); if (this.onUndo) this.onUndo(); }
  }

  // ---- specks: what is too small to see from here ----
  // Taken up once, when first seen fixed and on show: its ball in the world, and how far off it must be to be under the size.
  _speck(o, batch = false) {
    this._specked.add(o);
    if (!batch && (this.skip(o) || !fixed(o) || o.isSprite)) return;
    const ms = Array.isArray(o.material) ? o.material : [o.material]; if (!ms.length || ms.some(m => !m || bright(m))) return;
    const b = this._box; if (!boxOf(o, b)) return; if (wallLike(o, b) && this.places.fabric(b)) return;
    const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); if (!g.boundingSphere) return;
    const sp = this._sph.copy(g.boundingSphere).applyMatrix4(o.matrixWorld); if (!(sp.radius > 0) || sp.radius > 4) return;      // (nothing bigger than that is ever so small on the screen as to be worth asking)
    const e = o.matrixWorld.elements;
    const pa = g.attributes.position; if (!pa || pa.version > 1) return;      // (a shape that is written again and again, a trail or a beam, is not one whose size can be known)
    this.specks.push({ o, e, g, pa, pv: pa.version, x: e[12], y: e[13], z: e[14], t: e[0] + e[5] + e[10] + e[1] + e[6] + e[8], cx: sp.center.x, cy: sp.center.y, cz: sp.center.z, r: sp.radius, d2: 0, hid: false, ok: this._frames + 120 });
    this._f = 0; this._young++;      // (the distances are worked out again; and it is not hidden for a couple of seconds, until the culling and the streamer have taken it up as it is: src/visible.js keeps the layers it first finds a thing on)
  }
  /** Each frame of play, with the camera in its place for the frame and the drawing's height in pixels: what is too small to see is put out of sight, and back. */
  specksAt(cam, px) {
    if (this.off || NOSPECK) return;
    const L = this.specks, p = cam.position, f = px / 2 / Math.tan(cam.fov * Math.PI / 360) / (cam.zoom || 1);
    if (Math.abs(f - this._f) > 1e-6) { this._f = f; for (const s of L) { const far = 2 * s.r * f / SPECK + s.r; s.d2 = far * far; s.n2 = (far * 0.85) * (far * 0.85); } this._at.set(1e9, 0, 0); }
    this._frames++;
    if (!this._young && p.distanceToSquared(this._at) < 0.04) return;      // (it only changes as the camera moves)
    this._at.copy(p); let gone = 0, young = 0;
    for (let i = 0; i < L.length; i++) {
      const s = L[i], o = s.o, e = s.e;
      if (e[12] !== s.x || e[13] !== s.y || e[14] !== s.z || e[0] + e[5] + e[10] + e[1] + e[6] + e[8] !== s.t || !o.parent || o.userData.baked || o.geometry !== s.g || s.g.attributes.position !== s.pa || s.pa.version !== s.pv) { if (s.hid) { o.userData.tiny = false; applyLayers(o); } s.dead = true; gone++; continue; }      // (it moved, went, or had its shape written again: drawn as it was, and never asked again)
      const dx = s.cx - p.x, dy = s.cy - p.y, dz = s.cz - p.z, d2 = dx * dx + dy * dy + dz * dz;
      if (s.ok > this._frames) { young++; continue; }
      const hid = s.hid ? d2 > s.n2 : d2 > s.d2;      // (a little nearer to come back than to go: no flicker at the edge)
      if (hid !== s.hid) { s.hid = hid; o.userData.tiny = hid; applyLayers(o); }
    }
    if (gone) this.specks = L.filter(s => !s.dead);
    this._young = young;
    let h = 0; for (const s of this.specks) if (s.hid) h++; this.hidden = h;
  }
  /** Everything too small is drawn again (out of play: the title, the opening, a staged view). */
  specksAll() { if (!this.hidden) return; for (const s of this.specks) if (s.hid) { s.hid = false; s.o.userData.tiny = false; applyLayers(s.o); } this.hidden = 0; this._at.set(1e9, 0, 0); }

  /** fn() (the culling taking up what is new: src/visible.js register) with every batched piece, and every speck, on the layers
   *  it would be on without that: the culling keeps the layers it first finds a thing on, and goes back to them whenever it shows it. */
  filing(fn) {
    const L = []; for (const B of this.batches) for (const r of B.recs) L.push(r.o); for (const s of this.specks) if (s.hid) L.push(s.o);
    const was = L.map(o => [o.userData.baked, o.userData.tiny]);
    for (const o of L) { o.userData.baked = o.userData.tiny = false; applyLayers(o); }
    try { fn(); } finally { L.forEach((o, i) => { o.userData.baked = was[i][0]; o.userData.tiny = was[i][1]; applyLayers(o); }); }
  }
  // (for tools: what undid each batch, and how many pieces it took back)
  _log(B, bad, why) { if (!this.log) this.log = []; if (this.log.length < 400) { let q = bad, n = ''; while (q && !n) { n = q.name; q = q.parent; } this.log.push([why, n || '?', bad.type, B.recs.length, this.state || '']); } }
  _undo(B) {
    if (B.dead) return;
    B.dead = true; this.broken++;
    B.mesh.removeFromParent(); B.mesh.geometry.dispose();
    for (const r of B.recs) { delete r.o.userData.baked; applyLayers(r.o); this.pieces--; }
  }
  /** Everything drawn as it was built (a tool, or after a throw). */
  undoAll() { for (const B of this.batches) this._undo(B); this.batches = []; this.pieces = 0; }
  /** For the readouts: batches made, pieces in them, batches undone, milliseconds this frame. */
  status() { return `bake: ${this.batches.length} batches of ${this.pieces} pieces (${this.broken} undone), ${this.hidden} of ${this.specks.length} specks hidden, ${this.ms.toFixed(2)} ms`; }
}
