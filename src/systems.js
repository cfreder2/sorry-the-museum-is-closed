// The building's systems: what a security officer could switch on from the control room, with real effects in the
// building. The control-room terminal types at it; nothing here draws a screen.
//
//   G.systems.list()            -> [{ id, name, usage, about }]
//   G.systems.run(id, args)     -> { ok, lines }      (args as typed; no args or `status` reports; bad args say the usage)
//   G.systems.zones()           -> the named sprinkler zones: [{ id, name, rooms, heads, on, wet }]
//   G.systems.state()           -> a plain object of what is on
//   G.systems.onEvent = text => ...   (optional) things that happen later: a valve timing out, a test ending
//   From the console: __ah.systems.run('sprinklers', ['lobby', 'on']).  From the address: ?sys=sprinklers+lobby+on;lights+lobby+on
//
// sprinklers  Ceiling heads rain in a zone until shut off, or for 90 s. Never in a gallery, and never where a work hangs:
//             the zones are worked out from the plan (public and back-of-house rooms by use and name), and then any room
//             with a work in it, or with one within spray reach of one of its doorways, is struck off whatever it is. The
//             floor is wet (the car's own wet-floor model: plan.puddles), and stays wet for a while after. A robot in the
//             rain breaks off, leaves for a dry room on its patch and stays out until the floor has dried.
// firetest    The galleries' suppression test, the safe one: inert gas, not water. Amber beacons over the doorways, a light
//             curtain across each (solid while it is drawn; lean on it and the test aborts, so nothing is ever shut in),
//             cold grey gas lying on the floor, never as high as the lowest picture, robots in the room frozen, then rebooting.
// lights      A room's lamps on or off, through src/lights.js, for tonight only. lift: call one to a floor. doors: honest
//             about the locks.
// pa          The public address chime, the words as a caption, and every robot stops to listen. `pa donuts`: one comes to
//             the control room, off duty, and takes no notice of the toy.
//
// The hardest rule in this building is that nothing is ever drawn over a work of art. Three things keep it:
//   * Everything see-through here (rain, ripples, sheen, mist, vapour, beacons, the curtain) is added with artSafe(): its
//     light is weighted by the frame's alpha, and a work is drawn with alpha 0 (src/finish.js keepTrue), so not one
//     pixel of a canvas shown true can change, from any camera.
//   * Mist and vapour never stand higher than the eye of the camera that is drawing them (worked out in their vertex
//     shader, so it holds for any camera), and never higher than 20 cm under the lowest work in the room. No line of
//     sight through them can rise to a picture: they are below it, as seen as well as in fact.
//   * The fire test's beacons and beams are thrown away, pixel by pixel, wherever they would lie in front of a work:
//     any work with a line of sight to one of the room's doorways, through however many doorways (_seenFrom).
// G.systems.artCheck(views) renders with and without all of it and counts.
//
// Cost: with nothing on, update() is a counter and, a few times a second, one comparison for each patch of sprinkler
// heads. A room that is raining is three draw calls (rain, floor, mist), built when the camera first comes near; a
// gallery under test is two (its lights, its vapour).

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { feature, features } from './features.js';
import { carve } from './plan.js';
import { BOT, ROOM, grid, nearestOpen, cellAt } from './guardplan.js';

const PHONE = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const TAU = Math.PI * 2;
const wrap = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const turn = (a, b, max) => a + Math.max(-max, Math.min(max, wrap(b - a)));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };

// ---- sprinklers
const SPACING = 3.4;          // a head every so many metres of ceiling
const SPRAY = 1.9;            // how far from under a head its water lands
const DOOR_REACH = 2.2;       // a work this near a zone's doorway, either side of it, and the zone is struck off
const RUN_FOR = 90;           // a valve shuts itself after this long
const REFILL = 20;            // and will not open again for this long
const DRY_FOR = 75;           // from soaked to dry, once the valve is shut
const SLICK = 0.3;            // wetter than this and the floor is slippery (about 50 s after the rain stops)
const DRIP_FOR = 26;          // the heads go on dripping
const NEAR = 36;              // a raining room further off than this is not drawn
const PER_HEAD = PHONE ? 36 : 90, MAX_DROPS = PHONE ? 2600 : 10000;
// ---- fire test
const TEST_FOR = 20, REBOOT = 6, TEST_WAIT = 40, TEST_REST = 45, VAPOUR_TOP = 0.5, UNDER = 0.2;
// ---- robots
const PARK = -900;            // a robot on its way to or from the control room is kept here, out of the building

// Light added to the frame, but only where the frame is not a work of art (the probe's blend, src/probe.js): the source is
// weighted by the destination's alpha (0 on a canvas), and the alpha is left as it was.
function artSafe(m) {
  Object.assign(m, { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstAlphaFactor, blendDst: THREE.OneFactor,
    blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor, fog: false });
  return m;
}

// ------------------------------------------------------------------ which rooms --
// What a room is, from its use and its name: a sprinkler zone, or a reason it will never be one.
const BY_USE = { lobby: 'lobby', shop: 'shop', cafe: 'cafe', wc: 'restrooms', checkroom: 'checkroom', education: 'learning', lockers: 'staff', plant: 'plant', restaurant: 'restaurant', kitchen: 'kitchens', auditorium: 'auditorium', service: 'service' };
const BY_NAME = [
  [/security|staff entrance/i, 'security'],
  [/plant|boiler|chiller|sprinkler valves|engineers/i, 'plant'],
  [/loading|receiving|goods lift|refuse/i, 'loading'],
  [/kitchen|canteen|cold room|dry goods|dish room|catering/i, 'kitchens'],
  [/locker|uniform|mail|housekeeping|coat store|chair store|stage store|lighting store|stock room|green room|volunteers/i, 'staff'],
  [/art stor|storage|\bstore\b|vault|archive|stacks|racks|conservation|study room|scroll|registrar|curator|library|examination|quarantine|mount-making|frame|x-ray|microscopy|varnish|crate|packing|regenstein hall|chagall|trading room|exhibition|gallery/i, '!works'],
  [/carpentry|paint shop|plexiglas|handlers|dye lab|studio|workshop/i, 'workshops'],
  [/entrance hall|group entrance|reception|foyer/i, 'entrances'],
  [/auditorium|stage/i, 'auditorium'],
  [/office|membership|human resources|finance|accounts|publications|visitor services|director|board room|deputy|education|school|lecture|seminar|faculty|critique/i, 'offices'],
  [/range\b.*not public/i, 'ranges'],
];
const POWER = /electrical|substation|switchroom|server room|information technology|projection/i;
const ZONE_NAMES = {
  lobby: 'Michigan Avenue lobby', shop: 'Museum shops', cafe: 'Cafés', restrooms: 'Restrooms', checkroom: 'Checkroom', learning: 'Learning centre', staff: 'Staff rooms', plant: 'Plant rooms',
  restaurant: 'Restaurant', kitchens: 'Kitchens', auditorium: 'Auditoria', entrances: 'Entrance halls and foyers', service: 'Service rooms', security: 'Security and staff entrances', loading: 'Loading dock', workshops: 'Workshops',
  offices: 'Offices', ranges: 'Back-of-house ranges', 'corridors-ll': 'Service corridors, Sub-level 1', 'corridors-1': 'Service corridors, first floor', 'corridors-2': 'Service corridors, second floor',
  'corridors-3': 'Service corridors, third floor', other: 'Other back rooms',
};
const FLOOR_NAME = { LL: 'Sub-level 1', 1: 'first floor', 2: 'second floor', 3: 'third floor' };
function classify(r) {
  if (r.secret || r.floor === 'X' || r.use === 'secret') return '!none';
  if (r.kind !== 'room') return '!gallery';                               // galleries, Griffin Court, the passage hung with miniatures
  if (/^gallery\b/i.test(r.gallery || '') && r.use !== 'cafe') return '!gallery';      // the balconies over the court are numbered galleries
  if (r.use === 'stair' || r.use === 'lift') return '!riser';
  if (r.use === 'terrace') return '!outdoors';
  if (r.use === 'store') return '!works';
  if (POWER.test(r.gallery || '')) return '!power';
  if (r.use === 'corridor') return 'corridors-' + String(r.floor).toLowerCase();
  if (BY_USE[r.use]) return BY_USE[r.use];
  for (const [re, z] of BY_NAME) if (re.test(r.gallery || '')) return z;
  return 'other';
}

// ------------------------------------------------------------------ shaders --
const NOISE = /* glsl */`
  float h21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
  float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }`;
// The toy's headlamp, for whatever it falls on (a cone from uLampPos along uLampDir).
const LAMP_PARS = /* glsl */`uniform vec3 uLampPos; uniform vec3 uLampDir; uniform float uLampK; uniform float uLampCos;
  float lampAt(vec3 p) { vec3 d = p - uLampPos; float l = length(d); return uLampK * smoothstep(uLampCos, uLampCos + 0.1, dot(d / max(l, 1e-3), uLampDir)) / (1.0 + l * l * 0.06); }`;

// Rain: one streak to an instance, all of it worked out in the vertex shader. A drop leaves its head, is thrown outwards
// and falls (a parabola: the umbrella under a sprinkler), and is drawn as a short soft streak along the way it is going,
// turned to face the camera. Drops that left while the valve was open are drawn; after it shuts, a few go on dripping.
const RAIN_V = /* glsl */`
  attribute vec3 aHead; attribute vec4 aSeed;
  uniform float uTime, uOn, uOff, uFloor, uR, uDrip; uniform vec2 uLo, uHi;
  ${LAMP_PARS}
  varying vec2 vQ; varying float vA; varying float vLamp;
  void main() {
    vQ = position.xy; vA = 0.0; vLamp = 0.0;
    float H = aHead.y - uFloor, v0 = 1.4;
    float T = (-v0 + sqrt(v0 * v0 + 19.6 * H)) / 9.8;
    float per = T * (1.12 + 0.55 * aSeed.z);
    float t = fract(uTime / per + aSeed.w) * per, born = uTime - t, spread = 1.0;
    if (!(born > uOn && born < uOff && t < T)) {
      float perD = 1.3 + 2.8 * aSeed.z; t = fract(uTime / perD + aSeed.w) * perD; born = uTime - t;
      if (!(aSeed.y < 0.12 && born > uOff && born < uOff + uDrip * (0.25 + 0.75 * aSeed.x) && t < T)) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
      spread = 0.03;
    }
    float a = aSeed.x * 6.2832, rr = uR * sqrt(aSeed.y) * spread;
    vec2 land = clamp(aHead.xz + vec2(cos(a), sin(a)) * rr, uLo, uHi), off = land - aHead.xz;
    float u = t / T;
    vec3 p = vec3(aHead.x + off.x * u, aHead.y - (v0 * t + 4.9 * t * t), aHead.z + off.y * u);
    vec3 vel = vec3(off.x / T, -(v0 + 9.8 * t), off.y / T);
    float sp = length(vel); vec3 d = vel / sp;
    vec3 toCam = cameraPosition - p; float dist = length(toCam);
    vec3 side = normalize(cross(d, toCam));
    float len = clamp(sp * 0.024, 0.04, 0.26), wid = max(0.0035, dist * 0.0008);
    vec3 wp = p - d * len * position.y + side * wid * position.x;
    wp.y = max(wp.y, uFloor + 0.006);
    vA = (1.0 - smoothstep(24.0, 40.0, dist)) * smoothstep(0.3, 1.4, dist) * min(1.0, 0.0065 / wid) * smoothstep(0.0, 0.06, u);
    vLamp = lampAt(p);
    gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
  }`;
const RAIN_F = /* glsl */`
  uniform vec3 uCol; varying vec2 vQ; varying float vA; varying float vLamp;
  void main() {
    float across = 1.0 - abs(vQ.x); across *= across;
    float along = smoothstep(0.0, 0.12, vQ.y) * (1.0 - 0.8 * vQ.y);
    gl_FragColor = vec4((uCol + vec3(1.0, 0.93, 0.8) * vLamp * 2.4) * across * along * vA, 1.0);
  }`;

// The wet floor: a sheet a centimetre and a half over the floor that adds what water adds. A sharper, stronger mirror of
// the room (the floor's own mirror, src/reflect.js) at a glancing angle, the headlamp's long glint, the room's light, and
// the rings where drops land. The wet spreads from under each head and dries in patches, the low places last.
const FLOOR_V = /* glsl */`
  uniform mat4 reflMatrix; uniform float uHide, uFloor;
  varying vec3 vW; varying vec4 vRefl;
  void main() { vW = position; vRefl = reflMatrix * vec4(position.x, uFloor, position.z, 1.0);
    gl_Position = uHide > 0.5 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * vec4(position, 1.0); }`;
const FLOOR_F = /* glsl */`
  uniform sampler2D tRefl; uniform float reflOn, reflY, uFloor;
  uniform float uTime, uGrow, uWet, uRain, uDripK, uR; uniform vec4 uGrid; uniform vec3 uCol;
  ${LAMP_PARS} ${NOISE}
  varying vec3 vW; varying vec4 vRefl;
  // Where drops land: each cell of a grid is struck now and then, and a soft ripple runs out from a point in it and is
  // gone in under half a second. Nothing is drawn for it: it is the lean of the water's surface (xy), which bends what
  // the floor mirrors and scatters the headlamp's glint; and a very little light where the drop itself lands (z).
  vec3 rings(vec2 p, float scale, float seed, float gate) {
    vec2 g = p * scale + seed * 13.7, id = floor(g), f = fract(g) - 0.5;
    float h = h21(id + seed);
    float per = 0.34 + 0.3 * h21(id + 3.1), cyc = uTime / per + h * 9.0, ph = fract(cyc), k = floor(cyc);
    float hit = step(h21(id + k * 0.37 + 1.7), gate);                 // which cells a drop is landing in this time round
    vec2 d = f - (vec2(h21(id + 11.3 + k), h21(id + 5.7 + k)) - 0.5) * 0.4;
    float r0 = max(length(d), 1e-3), ang = atan(d.y, d.x);
    float r = r0 * (1.0 + 0.16 * sin(ang * 3.0 + h * 40.0 + k) + 0.09 * sin(ang * 5.0 - k * 1.7));      // never quite round
    float w = (r - ph * 0.3) * 11.0;                                  // one broad soft swell, not a line
    float fade = (1.0 - ph) * (1.0 - ph) * (1.0 - ph) * hit;
    float splash = exp(-r0 * r0 * 420.0) * (1.0 - smoothstep(0.0, 0.22, ph)) * hit;
    return vec3(d / r0 * (-2.0 * w * exp(-w * w)) * fade, splash);
  }
  void main() {
    vec2 p = vW.xz;
    vec3 V = cameraPosition - vW; float dist = length(V); V /= dist;
    float n = vn(p * 0.8) * 0.6 + vn(p * 2.3 + 7.0) * 0.4;
    vec2 cell = (fract((p - uGrid.xy) / uGrid.zw) - 0.5) * uGrid.zw;
    float wetIn = smoothstep(0.0, 0.3, uGrow * 2.6 - length(cell) / uR + (n - 0.5) * 0.6);
    float wetOut = smoothstep(n * 0.8, n * 0.8 + 0.18, uWet);
    float wet = wetIn * wetOut;
    if (wet < 0.004) discard;
    float lod = 1.0 - smoothstep(6.0, 20.0, dist);
    float gate = uRain * 0.75 + uDripK * 0.06;
    vec3 rg = (rings(p, 5.3, 1.0, gate) + rings(p, 8.1, 2.0, gate)) * lod;
    vec2 lean = rg.xy * 0.5 + (vec2(vn(p * 5.0 + uTime * 0.25), vn(p * 5.0 - uTime * 0.21 + 3.0)) - 0.5) * (0.035 + 0.05 * uRain);
    vec3 N = normalize(vec3(lean.x, 1.0, lean.y));
    float ndv = clamp(dot(N, V), 0.0, 1.0), fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
    float level = reflOn * (1.0 - step(0.08, abs(uFloor - reflY)));
    vec2 ruv = vRefl.xy / vRefl.w + lean * 0.13;
    vec3 rc = min(texture2D(tRefl, ruv, 0.4).rgb, vec3(3.0));
    vec3 col = rc * fres * level * 1.1;
    // (with no mirror to read, on another level or with the polish switched off for speed, the room's own light does the work)
    col += uCol * mix(0.05 + 0.85 * fres, 0.004 + 0.044 * fres, level);
    // the headlamp on the water: a tight glint and a long soft one, broken up by the rings
    vec3 L = uLampPos - vW; float ld = length(L); L /= max(ld, 1e-3);
    float nh = max(dot(N, normalize(L + V)), 0.0), lamp = lampAt(vW);
    col += vec3(1.0, 0.92, 0.78) * lamp * (pow(nh, 320.0) * 5.0 + pow(nh, 40.0) * 0.5);
    col += (uCol * 0.5 + rc * 0.4 + vec3(1.0, 0.92, 0.78) * lamp) * rg.z * 0.12;
    gl_FragColor = vec4(col * wet, 1.0);
  }`;

// The mist under the rain: soft sheets that stand upright facing the camera, each drifting out from where it began and
// fading. Never higher than uTop over the floor, nor than the eye that sees it, and never through a wall: its middle
// is kept its own half-width inside the room. (From above they are edge-on and fade out.)
const PUFF_V = /* glsl */`
  attribute vec4 aA; attribute vec4 aS;
  uniform float uTime, uK, uFloor, uTop, uSpeed, uLife, uWide, uFront; uniform vec2 uLo, uHi;
  ${LAMP_PARS}
  varying vec2 vQ; varying float vA; varying float vLamp; varying float vSeed;
  void main() {
    vQ = position.xy; vSeed = aS.y * 31.0;
    float life = uLife * (0.7 + 0.6 * aS.x), age = fract(uTime / life + aS.y);
    vec2 tang = vec2(-aA.w, aA.z);
    float hw = uWide * mix(0.4, 1.0, age) * (0.75 + 0.5 * aS.w), gone = pow(age, 0.8);
    vec2 c = aA.xy + aA.zw * (0.1 + uSpeed * life * gone) + tang * sin(uTime * 0.31 + aS.z * 6.2832) * 0.6 * age;
    c = clamp(c, uLo + hw + 0.05, max(uLo + hw + 0.05, uHi - hw - 0.05));
    float top = min(uTop, cameraPosition.y - uFloor - 0.03);        // never higher than the eye that sees it
    float hh = max(top - 0.03, 0.0) * 0.5 * mix(0.5, 1.0, sqrt(age));
    vec3 centre = vec3(c.x, uFloor + 0.02 + hh, c.y), toCam = cameraPosition - centre;
    float up = abs(normalize(toCam).y);
    vec3 right = normalize(vec3(toCam.z, 0.0, -toCam.x) + vec3(1e-4, 0.0, 0.0));
    vec3 wp = centre + right * position.x * hw + vec3(0.0, position.y * hh, 0.0);
    vA = uK * smoothstep(0.0, 0.15, age) * (1.0 - smoothstep(0.6, 1.0, age)) * (1.0 - smoothstep(0.35, 0.8, up)) * smoothstep(uFront * 1.25, uFront * 1.25 - 0.2, gone);
    vA *= smoothstep(0.6, 2.8, length(toCam)) * smoothstep(0.05, 0.17, top);      // (a sheet right in front of the eye is a sheet: they fade out close to)
    vLamp = lampAt(centre);
    gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
  }`;
const PUFF_F = /* glsl */`
  uniform vec3 uCol; uniform float uTime; ${NOISE}
  varying vec2 vQ; varying float vA; varying float vLamp; varying float vSeed;
  void main() {
    float r = length(vQ), a = 1.0 - smoothstep(0.0, 1.0, r);
    a *= 0.5 + 0.8 * vn(vQ * vec2(2.2, 1.2) + vSeed + vec2(uTime * 0.09, 0.0));
    gl_FragColor = vec4((uCol + vec3(1.0, 0.93, 0.8) * vLamp * 0.9) * a * a * vA, 1.0);
  }`;

// The fire test's vapour: cold, heavy gas lying on the floor. Not cards: one box over the room's floor, as high as the
// gas may stand, and every pixel of it walks its own line of sight through that layer and adds up the gas it passes
// (a few steps: the layer is thin). So there is no surface to it and no edge: it thins to nothing at its top, at the
// doorways, and wherever there is none. The gas is heaped in a tongue at each vent and thins outwards (uVent, a little
// map of the room made once: r, how much reaches here; g, 0 at a doorway), rolls out from the walls in long slow
// folds (uNoise, a tiling cloud), stands higher and lower as swells pass through it, and leaves clear floor between.
// It is added, never laid over (artSafe), grey rather than white, and held well under what the bloom picks up.
// The top of the box is never higher than the eye of the camera drawing it (so no line of sight through it rises),
// nor than uTop (20 cm under the lowest work in the room).
const FOG_V = /* glsl */`
  uniform float uFloor, uTop; uniform vec2 uLo, uHi;
  varying vec3 vW; varying float vTop;
  void main() {
    float top = min(uTop, cameraPosition.y - uFloor - 0.03);
    vTop = top;
    vW = vec3(mix(uLo.x, uHi.x, position.x), uFloor + 0.012 + max(top - 0.012, 0.0) * position.y, mix(uLo.y, uHi.y, position.z));
    gl_Position = top < 0.07 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * vec4(vW, 1.0);
  }`;
const FOG_F = /* glsl */`
  uniform sampler2D uNoise, uVent; uniform float uTime, uK, uFront, uFloor, uSteps, uShimmer; uniform vec2 uLo, uHi; uniform vec3 uCol;
  varying vec3 vW; varying float vTop;
  // The gas over one spot is thickest on the floor and gone at height h. This is how much of it lies below y, so a
  // stretch of a line of sight can be given its exact share however steeply it comes down through the layer.
  float below(float y, float h) { float a = 0.2 * h; y = clamp(y, 0.0, h); return y < a ? y : a + (h * (y - a) - 0.5 * (y * y - a * a)) / (0.8 * h); }
  void main() {
    vec3 ro = cameraPosition, rd = normalize(vW - ro);
    rd += (1.0 - step(1e-5, abs(rd))) * 1e-5;
    // the stretch of this line of sight that lies in the layer
    vec3 bmin = vec3(uLo.x, uFloor + 0.012, uLo.y), bmax = vec3(uHi.x, uFloor + vTop, uHi.y);
    vec3 ta = (bmin - ro) / rd, tb = (bmax - ro) / rd, tn = min(ta, tb), tf = max(ta, tb);
    float t0 = max(max(tn.x, tn.y), max(tn.z, 0.0)), t1 = min(tf.x, min(tf.y, tf.z));
    if (t1 <= t0) discard;
    float len = min(t1 - t0, 18.0), dt = len / uSteps, od = 0.0, tm = uTime;
    float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + fract(tm * 7.13) * uShimmer);      // (where each step is taken: a different place in every pixel, and every frame)
    vec2 size = uHi - uLo; float reach = uFront * (0.5 * min(size.x, size.y) + 3.0);
    for (int i = 0; i < 12; i++) {
      if (float(i) >= uSteps) break;
      float ts = t0 + float(i) * dt;
      vec3 p = ro + rd * (ts + (0.2 + 0.6 * jit) * dt);
      vec2 q = p.xz, vd = texture2D(uVent, (q - uLo) / size).rg;
      // slow cloud, curled a little as it drifts; and a finer one across it
      vec2 curl = 0.5 * vec2(sin(q.y * 0.9 + tm * 0.21), cos(q.x * 0.8 - tm * 0.17));
      float n = texture2D(uNoise, (q + curl) * 0.085 + vec2(tm * 0.006, -tm * 0.004)).r;
      float fine = texture2D(uNoise, q * 0.27 + vec2(-tm * 0.019, tm * 0.015) + 0.5).r;
      float edge = min(min(q.x - uLo.x, uHi.x - q.x), min(q.y - uLo.y, uHi.y - q.y));
      float front = smoothstep(reach, reach - 2.4, edge + (n - 0.5) * 2.6);                   // it comes in from the walls
      // the tongue out of a vent: it breathes, a little longer and a little shorter
      float tongue = smoothstep(0.08, 0.6, vd.r + 0.22 * (fine - 0.5) + 0.05 * sin(tm * 0.35 + n * 6.0));
      // how high it stands here: heaped at a vent, lower out in the room, with slow swells (wisps that rise and fall back)
      float h = vTop * clamp(0.22 + 0.55 * tongue + 0.6 * (n - 0.3) + 0.2 * (fine - 0.5), 0.1, 1.0);
      float amount = 0.16 + tongue + smoothstep(0.32, 0.72, n) * (0.4 + 0.9 * fine);            // clear floor between the clouds
      float ya = ro.y + rd.y * ts - uFloor, yb = ya + rd.y * dt, dy = abs(ya - yb);
      float share = dy > 1e-3 ? abs(below(ya, h) - below(yb, h)) / dy : clamp((h - 0.5 * (ya + yb)) / (0.8 * h), 0.0, 1.0);
      od += share * amount * front * vd.g * dt;
    }
    // (grey, and never more than this much of it: it stays under what the bloom picks up, and the boards show through)
    float alpha = (1.0 - exp(-2.0 * od)) * 0.6 * uK * smoothstep(0.07, 0.2, vTop);
    gl_FragColor = vec4(uCol * alpha, 1.0);
  }`;

// Lit things in a fire test: the beacon over a doorway, the beams of the light curtain across it, the slit of a vent.
// They are in doorways and on walls, where a picture may be behind them from somewhere: so each pixel asks whether it lies
// in front of a work, seen from this camera (a canvas: a rectangle on its wall; a thing on a plinth: an upright drum
// round it), and is thrown away if it does. The works are every one that has a line of sight to one of the room's
// doorways (_seenFrom, below): uG, a texture three wide, a row to a work (centre and kind; along and out of the wall; half sizes).
const MAXG = 240;
const GLOW_V = /* glsl */`
  attribute vec4 aC; varying vec2 vQ; varying vec4 vC; varying vec3 vWp;
  void main() { vQ = position.xy * 2.0; vC = aC; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vWp = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const GLOW_F = /* glsl */`
  uniform float uTime, uK, uCurtain, uCalm; varying vec2 vQ; varying vec4 vC; varying vec3 vWp;
  uniform sampler2D uG; uniform int uGN;
  bool overArt(vec3 E, vec3 P) {
    float grow = 0.03 + 0.004 * distance(E, P);
    for (int i = 0; i < ${MAXG}; i++) {
      if (i >= uGN) break;
      vec4 C = texelFetch(uG, ivec2(0, i), 0);
      if (C.w > 0.5) {
        vec2 e = C.xz - E.xz, d = P.xz - E.xz; float q = dot(e, d) / max(dot(d, d), 1e-6);
        if (q <= 1.0) continue;                                        // the thing is not beyond this pixel
        vec3 at = E + (P - E) * q; vec4 H = texelFetch(uG, ivec2(2, i), 0);
        if (distance(at.xz, C.xz) < H.x + grow * q && abs(at.y - C.y) < H.y + grow * q) return true;
      } else {
        vec4 A = texelFetch(uG, ivec2(1, i), 0);
        float s = dot(E.xz - C.xz, A.zw), f = dot(P.xz - C.xz, A.zw);
        if (s <= 0.0 || f <= 0.0 || f >= s) continue;                  // seen from behind, or the pixel is not between
        float q = s / max(s - f, 1e-4); vec3 at = E + (P - E) * q; vec4 H = texelFetch(uG, ivec2(2, i), 0);
        if (abs(dot(at.xz - C.xz, A.xy)) < H.x + grow * q && abs(at.y - C.y) < H.y + grow * q) return true;
      }
    }
    return false;
  }
  void main() {
    if (overArt(cameraPosition, vWp)) discard;
    float x = min(abs(vQ.x), 1.0), y = min(abs(vQ.y), 1.0), a;      // (clamped: with MSAA a varying can stray just outside, and pow() of a negative is not a number)
    if (vC.a < 0.5) {             // a beacon: two quick flashes and a rest (steady, with motion reduced)
      float ph = fract(uTime * 0.9), fl = max(smoothstep(0.0, 0.03, ph) * (1.0 - smoothstep(0.1, 0.16, ph)), smoothstep(0.22, 0.25, ph) * (1.0 - smoothstep(0.32, 0.4, ph)));
      a = (1.0 - smoothstep(0.55, 1.0, x)) * pow(1.0 - y, 1.5) * mix(0.12 + 0.88 * fl, 0.6, uCalm) * uK;
    } else if (vC.a < 1.5) {      // a beam of the curtain
      a = (1.0 - smoothstep(0.92, 1.0, x)) * (pow(1.0 - y, 6.0) + 0.1 * (1.0 - y)) * (0.8 + 0.2 * sin(vQ.x * 40.0 - uTime * 5.0 * (1.0 - uCalm))) * uCurtain;
    } else {                      // a vent
      a = (1.0 - smoothstep(0.7, 1.0, x)) * (1.0 - y) * 0.5 * uK;
    }
    gl_FragColor = vec4(vC.rgb * a, 1.0);
  }`;

// ------------------------------------------------------------------ geometry --
function paint(g, hex) {
  g = g.index ? g.toNonIndexed() : g; if (g.attributes.uv) g.deleteAttribute('uv');
  const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
}
// A pendent sprinkler head, hanging from y = 0: a plate on the ceiling, a brass body, two arms, the red bulb, the deflector.
// Half as big again as a real one, so it can be seen from the floor.
function headGeo() {
  const BRASS = 0xb08a3c, PLATE = 0xd8d4c8, RED = 0xc02418, parts = [];
  const cyl = (r0, r1, h, y, hex, seg = 10) => { const g = new THREE.CylinderGeometry(r0, r1, h, seg); g.translate(0, y - h / 2, 0); parts.push(paint(g, hex)); };
  cyl(0.06, 0.066, 0.012, 0, PLATE, 16);
  cyl(0.02, 0.02, 0.05, -0.012, BRASS);
  cyl(0.026, 0.026, 0.018, -0.062, BRASS, 6);
  cyl(0.007, 0.007, 0.05, -0.08, RED, 6);
  for (const s of [-1, 1]) { const g = new THREE.BoxGeometry(0.008, 0.06, 0.012); g.translate(s * 0.024, -0.108, 0); parts.push(paint(g, BRASS)); }
  cyl(0.012, 0.012, 0.012, -0.13, BRASS, 6);
  cyl(0.05, 0.044, 0.006, -0.142, BRASS, 14);
  return mergeGeometries(parts);
}
function selfLit(mat, k) {
  mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vColor.rgb * ' + k.toFixed(3) + ';'); };
  mat.customProgramCacheKey = () => 'sysLit' + k;
  return mat;
}
const QUAD = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; })();
const QUAD2 = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; })();
function instanced(base, attrs, count) {
  const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.setAttribute('position', base.attributes.position);
  for (const [name, arr, size] of attrs) g.setAttribute(name, new THREE.InstancedBufferAttribute(arr, size));
  g.instanceCount = count; return g;
}
// A small repeatable dice, so a room's rain is the same every time it is made.
function dice(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// A tiling cloud, for the vapour: three octaves of value noise that repeat at the edges.
let _cloud = null;
function cloudTex() {
  if (_cloud) return _cloud;
  const N = 128, data = new Uint8Array(N * N);
  const lattice = (cells, seed) => { const rnd = dice(seed), g = new Float32Array(cells * cells); for (let i = 0; i < g.length; i++) g[i] = rnd(); return (u, v) => { const x = u * cells, y = v * cells, i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), at = (a, b) => g[(b % cells) * cells + (a % cells)]; return at(i, j) * (1 - sx) * (1 - sy) + at(i + 1, j) * sx * (1 - sy) + at(i, j + 1) * (1 - sx) * sy + at(i + 1, j + 1) * sx * sy; }; };
  const o1 = lattice(3, 911), o2 = lattice(6, 1723), o3 = lattice(12, 3037);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const u = (i + 0.5) / N, v = (j + 0.5) / N, n = 0.55 * o1(u, v) + 0.3 * o2(u, v) + 0.15 * o3(u, v); data[j * N + i] = Math.round(255 * clamp((n - 0.5) * 1.7 + 0.5, 0, 1)); }
  const t = new THREE.DataTexture(data, N, N, THREE.RedFormat, THREE.UnsignedByteType); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
  return (_cloud = t);
}

const say = (ok, ...lines) => ({ ok, lines: lines.flat().filter(l => l != null) });
const LIST = [
  { id: 'sprinklers', name: 'Sprinklers', usage: 'sprinklers <zone|all> on|off', about: 'Wet-pipe sprinklers in public and back-of-house zones; never in a gallery.' },
  { id: 'firetest', name: 'Fire suppression test', usage: 'firetest <gallery|wing>', about: 'A 20-second test of a gallery’s inert-gas suppression: beacons, light curtains, vapour. No water.' },
  { id: 'lights', name: 'Lighting', usage: 'lights <zone|room|all> on|off', about: 'Room lighting by zone, as if somebody had thrown the switch.' },
  { id: 'lift', name: 'Lifts', usage: 'lift call <floor> [n] | lift status', about: 'Calls a lift to a floor and holds it there.' },
  { id: 'doors', name: 'Doors', usage: 'doors status | doors unlock <door>', about: 'The state of the outside doors. Vents are not on this system.' },
  { id: 'pa', name: 'Public address', usage: 'pa <message>', about: 'A chime and an announcement in every room.' },
];

const S = feature({
  id: 'systems',

  init(k) {
    this.k = k; const G = k.G;
    this.t = 0; this.tick = 0; this.live = false;
    this.root = new THREE.Group(); this.root.name = 'building systems'; k.group.add(this.root);
    this.fx = new THREE.Group(); this.root.add(this.fx);
    // The frame's alpha is 0 on a work and 1 elsewhere, until one of the game's own lights is added over a place (a
    // picture lamp's pool on the floor, its wash on the wall, a searchlight): each is a rectangle that adds its alpha
    // too, and the frame is floating point, so inside it the alpha stands at 2 or 3, and whatever is weighted by it
    // afterwards comes out two or three times as bright, in the shape of the rectangle. So, once, just before
    // anything of this file's is drawn: every pixel's alpha is brought down to 1 at most. (Colour is not touched, and
    // a work's 0 stays 0.)
    const level = new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)), new THREE.ShaderMaterial({
      vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: 'void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); }',
      transparent: true, depthTest: false, depthWrite: false, fog: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.OneFactor,
      blendEquationAlpha: THREE.MinEquation, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor }));
    level.frustumCulled = false; level.renderOrder = 4.5; level.visible = false; level.name = 'alpha levelled'; this.fx.add(level); this.level = level;
    // Uniforms every effect shares: the clock, and the toy's headlamp.
    this.U = { uTime: { value: 0 }, uLampPos: { value: new THREE.Vector3() }, uLampDir: { value: new THREE.Vector3(0, 0, 1) }, uLampK: { value: 0 }, uLampCos: { value: 0.8 } };
    this.wet = new Map();           // room id -> its rain and its wet floor, while there is any
    this.tests = new Map();         // room id -> its fire test
    this.rested = new Map();        // room or zone id -> when it may be used again
    this.busy = new Set();          // robots the building has a hold of
    this.calls = [];                // lifts called and held
    this.events = [];
    this.pa = { until: 0, text: '' };
    this._zones(k);
    this._heads(k);
    const self = this;
    G.systems = {
      list: () => LIST.map(s => ({ ...s })),
      run: (id, args) => self.run(String(id || '').toLowerCase(), (args || []).map(String)),
      zones: () => self.zoneList.map(z => ({ id: z.id, name: z.name, rooms: z.rooms.length, heads: z.heads, on: z.rooms.some(r => self.wet.get(r.id)?.on), wet: z.rooms.some(r => self.wet.has(r.id)) })),
      state: () => self.state(),
      wetAt: (x, z, y) => self.wetAt(x, z, y),
      rainAt: (x, z, y) => self.rainAt(x, z, y),
      guard: (b, dt, gf) => self.guard(b, dt, gf),
      artCheck: (views, w) => self.artCheck(views, w),
      events: this.events, onEvent: null,
      wings: () => Object.entries(self.wings).map(([id, w]) => ({ id, name: w.name, galleries: w.rooms.length })),
      refused: id => self.refusal(k.plan.byId[id]),
      _self: this,
    };
    // ?sys=sprinklers+lobby+on;lights+lobby+on : commands run a moment after the start, for testing without the terminal.
    const q = typeof location !== 'undefined' && new URLSearchParams(location.search).get('sys');
    if (q) this.auto = q.split(';').map(c => c.trim().split(/\s+/)).filter(c => c[0]);
  },

  // ---------------------------------------------------------------- zones
  _zones(k) {
    const P = k.plan, M = k.museum, arts = M.arts;
    this.cls = new Map(); this.struck = [];
    const zones = new Map();
    // A work's ends along its wall (or, for something on a plinth, its footprint), to measure from.
    const pts = arts.map(a => { const tx = Math.cos(a.rot || 0), tz = -Math.sin(a.rot || 0), h = a.obj ? (a.half || 0.3) : a.w / 2; return { a, y: a.fy || 0, p: [-1, -0.5, 0, 0.5, 1].map(u => [a.x + tx * h * u, a.z + tz * h * u]) }; });
    // (A picture is reached only from in front: one hung on the far face of the doorway's own wall has its back to the water.)
    const near = (q, y, m) => { for (const o of pts) { if (Math.abs(o.y - y) > 3.5) continue; const a = o.a; if (m > 0 && !a.obj && ((q.x0 + q.x1) / 2 - a.x) * a.nx + ((q.z0 + q.z1) / 2 - a.z) * a.nz < 0.1) continue; for (const [x, z] of o.p) if (x > q.x0 - m && x < q.x1 + m && z > q.z0 - m && z < q.z1 + m) return a; } return null; };
    for (const r of P.rooms) {
      let c = classify(r);
      if (c[0] !== '!') {
        // Whatever the plan calls it: a room with a work in it, or with one within spray reach of one of its doorways, is not a zone.
        const inside = M.rooms[r.id] && M.rooms[r.id].arts.length ? M.rooms[r.id].arts[0] : near(r, r.y, -0.05);
        let by = inside;
        if (!by) for (const d of P.doorsOf(r.id)) { if (d.out || d.vent) continue; by = near(d, d.y, DOOR_REACH); if (by) break; }
        if (by) { this.struck.push({ id: r.id, zone: c, work: by.work.t, room: by.room }); c = '!art'; r._sysArt = by; }
        else if (Math.min(r.x1 - r.x0, r.z1 - r.z0) < 1.5) c = '!small';
      }
      // A room behind a door that does not open (src/shut.js) has no valve, no switch and no heads: it is in no zone. But where a
      // zone is marked (spots(), below) is where its first room is, shut or not: other things keep their distance from the marks
      // (src/placing.js claimed()), and a mark that moved would move lost property and the guards' notes all over the building.
      this.cls.set(r.id, r.shut && c[0] !== '!' ? '!none' : c);
      if (c[0] === '!') continue;
      if (!zones.has(c)) zones.set(c, { id: c, name: ZONE_NAMES[c] || c, rooms: [], heads: 0, at: { x: (r.x0 + r.x1) / 2, y: r.y, z: (r.z0 + r.z1) / 2, shut: !!r.shut } });
      if (!r.shut) zones.get(c).rooms.push(r);
    }
    this.zoneMarks = [...zones.values()].sort((a, b) => a.id.localeCompare(b.id));
    this.zoneList = this.zoneMarks.filter(z => z.rooms.length);
    this.zoneOf = zones;
    // Wings, for the fire test: the galleries of one building on one floor.
    this.wings = {};
    const B = { main: 'the old building', modern: 'the Modern Wing', lower: 'Sub-level 1', first: 'the first building' };
    for (const r of P.rooms) {
      if (r.kind !== 'gallery' || r.secret) continue;
      const id = (r.building || 'main') + '-' + String(r.floor).toLowerCase();
      (this.wings[id] || (this.wings[id] = { name: r.building === 'lower' ? 'Sub-level 1' : (B[r.building] || r.building || 'the building') + ', ' + (FLOOR_NAME[r.floor] || 'floor ' + r.floor), rooms: [] })).rooms.push(r);
    }
  },
  // The words for "no".
  refusal(r) {
    if (!r) return null;
    const c = this.cls.get(r.id), id = r.id.toUpperCase(), name = (r.gallery || r.id).toUpperCase();
    if (!c || c[0] !== '!') return null;
    if (c === '!none') return ['No such zone.'];
    if (c === '!gallery' || c === '!art') {
      const st = this.k.museum.rooms[r.id], a = (st && st.arts.find(q => q.work.a)) || r._sysArt;
      const who = a && a.work.a ? String(a.work.a).split(/[\n(,]/)[0].trim().split(/\s+/).pop() : null;
      const what = r.kind === 'hall' ? `Zone ${id} is ${name}.` : c === '!gallery' ? `Zone ${id} is a GALLERY.` : `Zone ${id} (${name}) is within reach of a work of art.`;
      const there = who ? `There is ${/^[AEIOU]/i.test(who) ? 'an' : 'a'} ${who} ${c === '!gallery' && st && st.arts.length ? 'in there' : 'next door'}.` : 'There are works of art in there.';
      return [`${what} ${there}`, 'Request logged. Request reported.'];
    }
    if (c === '!works') return [`Zone ${id} is ${name}. Works are kept in there.`, 'Request logged. Request reported.'];
    if (c === '!power') return [`Zone ${id} is ${name}. Water and that do not mix.`, 'This terminal is plugged into it. Request declined.'];
    if (c === '!riser') return [`Zone ${id} (${name}) is on the dry riser. It is dry.`];
    if (c === '!outdoors') return [`Zone ${id} is outdoors. It is already snowing.`];
    return [`Zone ${id} has no heads.`];
  },
  // What somebody typed, as rooms: a zone, a wing, a room's number, `here`, `all`.
  resolve(word) {
    const P = this.k.plan, w = String(word || '').toLowerCase();
    if (!w) return null;
    if (w === 'all' || w === 'building') return { label: 'ALL ZONES', rooms: P.rooms.filter(r => !r.secret && !r.shut), all: true };
    if (w === 'here') { const r = this.k.room; return r ? { label: r.id.toUpperCase(), rooms: [r], one: true } : null; }
    if (this.zoneOf.has(w)) { const z = this.zoneOf.get(w); return { label: z.id.toUpperCase(), rooms: z.rooms, zone: z }; }
    if (w === 'corridors') return { label: 'CORRIDORS', rooms: this.zoneList.filter(z => z.id.startsWith('corridors')).flatMap(z => z.rooms) };
    if (this.wings[w]) return { label: w.toUpperCase(), rooms: this.wings[w].rooms, wing: this.wings[w] };
    const r = P.rooms.find(q => !q.secret && (q.id.toLowerCase() === w || q.id.toLowerCase() === 'g' + w || (q.gallery || '').toLowerCase() === w));
    if (r) return { label: r.id.toUpperCase(), rooms: [r], one: true };
    if (w === 'galleries') return { label: 'GALLERIES', rooms: P.rooms.filter(q => q.kind === 'gallery' && !q.secret) };
    return null;
  },

  // ---------------------------------------------------------------- the heads on the ceilings
  // Where a room's heads are: a grid, a little under SPACING apart, none over a stair well or a lift.
  _layout(r) {
    if (r._sys) return r._sys;
    const P = this.k.plan, w = r.x1 - r.x0, d = r.z1 - r.z0, nx = Math.max(1, Math.round(w / SPACING)), nz = Math.max(1, Math.round(d / SPACING));
    const top = r.y + r.h, heads = [];
    const gaps = [...P.wells.filter(q => q.y > r.y + 1 && q.y < top + 1.7), ...P.lifts.filter(l => l.stops[0] < top && l.stops[l.stops.length - 1] > r.y - 0.1), ...(P.skylights || []).filter(q => q.room === r.id)];
    const panels = (this.k.G.lights && this.k.G.lights.panelsOf && this.k.G.lights.panelsOf[r.id]) || [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      let x = r.x0 + (i + 0.5) * w / nx, z = r.z0 + (j + 0.5) * d / nz;
      if (gaps.some(q => x > q.x0 - 0.3 && x < q.x1 + 0.3 && z > q.z0 - 0.3 && z < q.z1 + 0.3)) continue;
      for (const p of panels) { const hx = p.longX ? 0.7 : 0.25, hz = p.longX ? 0.25 : 0.7; if (Math.abs(x - p.x) < hx && Math.abs(z - p.z) < hz) { if (p.longX) z = p.z + (z >= p.z ? 0.42 : -0.42); else x = p.x + (x >= p.x ? 0.42 : -0.42); } }
      heads.push(x, z);
    }
    return (r._sys = { nx, nz, cw: w / nx, cd: d / nz, y: top - 0.022, heads, exposed: r.use === 'backofhouse' || r.use === 'plant' || r.use === 'corridor' && r.floor === 'LL' || r.use === 'lockers' });
  },
  _heads(k) {
    // One mesh of heads (and one of pipe, where the pipework is left showing) to each 32 m patch of each level.
    const cells = this.cells = [], by = new Map(), CELL = 32;
    const cellAt3 = (x, y, z) => {
      const key = Math.round(y / 4) + '|' + Math.floor(x / CELL) + '|' + Math.floor(z / CELL);
      let c = by.get(key); if (!c) { c = { heads: [], pipes: [], x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity, z0: Infinity, z1: -Infinity }; by.set(key, c); cells.push(c); }
      c.x0 = Math.min(c.x0, x); c.x1 = Math.max(c.x1, x); c.y0 = Math.min(c.y0, y); c.y1 = Math.max(c.y1, y); c.z0 = Math.min(c.z0, z); c.z1 = Math.max(c.z1, z);
      return c;
    };
    let total = 0;
    for (const z of this.zoneList) for (const r of z.rooms) {
      const L = this._layout(r), h = L.heads; z.heads += h.length / 2; total += h.length / 2;
      for (let i = 0; i < h.length; i += 2) cellAt3(h[i], L.y, h[i + 1]).heads.push(h[i], L.y, h[i + 1]);
      if (!L.exposed || !h.length) continue;
      // A branch along each row of heads, and a main across them, hung just under the ceiling.
      const alongX = r.x1 - r.x0 >= r.z1 - r.z0, rows = new Map();
      for (let i = 0; i < h.length; i += 2) { const key = Math.round((alongX ? h[i + 1] : h[i]) * 4) / 4; const row = rows.get(key) || [Infinity, -Infinity]; const u = alongX ? h[i] : h[i + 1]; row[0] = Math.min(row[0], u); row[1] = Math.max(row[1], u); rows.set(key, row); }
      const lo = alongX ? r.x0 : r.z0, y = L.y - 0.05;
      for (const [v, [a, b]] of rows) { const u0 = lo + 0.04, u1 = b + 0.1; cellAt3(alongX ? (u0 + u1) / 2 : v, y, alongX ? v : (u0 + u1) / 2).pipes.push(alongX ? (u0 + u1) / 2 : v, y, alongX ? v : (u0 + u1) / 2, alongX ? u1 - u0 : 0.045, alongX ? 0.045 : u1 - u0); }
      if (rows.size > 1) { const vs = [...rows.keys()], v0 = Math.min(...vs), v1 = Math.max(...vs), u = lo + 0.12; cellAt3(alongX ? u : (v0 + v1) / 2, y, alongX ? (v0 + v1) / 2 : u).pipes.push(alongX ? u : (v0 + v1) / 2, y - 0.01, alongX ? (v0 + v1) / 2 : u, alongX ? 0.06 : v1 - v0 + 0.06, alongX ? v1 - v0 + 0.06 : 0.06); }
    }
    this.headCount = total;
    const geo = headGeo(), box = new THREE.BoxGeometry(1, 1, 1);
    const mat = selfLit(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.35 }), 0.36);
    const pipe = new THREE.MeshStandardMaterial({ color: 0x8e1f18, roughness: 0.5, metalness: 0.2, emissive: 0x8e1f18, emissiveIntensity: 0.35 });
    const M = new THREE.Matrix4(), I = new THREE.Quaternion(), V = new THREE.Vector3(), Sc = new THREE.Vector3();
    for (const c of cells) {
      c.meshes = [];
      if (c.heads.length) { const m = new THREE.InstancedMesh(geo, mat, c.heads.length / 3); for (let i = 0; i < c.heads.length; i += 3) m.setMatrixAt(i / 3, M.compose(V.set(c.heads[i], c.heads[i + 1], c.heads[i + 2]), I, Sc.set(1, 1, 1))); c.meshes.push(m); }
      if (c.pipes.length) { const m = new THREE.InstancedMesh(box, pipe, c.pipes.length / 5); for (let i = 0; i < c.pipes.length; i += 5) m.setMatrixAt(i / 5, M.compose(V.set(c.pipes[i], c.pipes[i + 1], c.pipes[i + 2]), I, Sc.set(c.pipes[i + 3], 0.045, c.pipes[i + 4]))); c.meshes.push(m); }
      for (const m of c.meshes) { m.instanceMatrix.setUsage(THREE.StaticDrawUsage); m.matrixAutoUpdate = false; m.frustumCulled = false; m.visible = false; m.name = 'sprinkler heads'; this.root.add(m); }
      c.heads = c.pipes = null;
    }
  },
  _headsNear(cam) {
    for (const c of this.cells) { const v = cam.x > c.x0 - 30 && cam.x < c.x1 + 30 && cam.z > c.z0 - 30 && cam.z < c.z1 + 30 && cam.y > c.y1 - 9 && cam.y < c.y1 + 2.5; for (const m of c.meshes) m.visible = v; }
  },

  // ---------------------------------------------------------------- commands
  run(id, args) {
    try {
      const f = { sprinklers: this._sprinklers, firetest: this._firetest, lights: this._lights, lift: this._lift, doors: this._doors, pa: this._pa }[id];
      if (!f) return say(false, `Unknown system: ${id}.`, 'Systems: ' + LIST.map(s => s.id).join(', ') + '.');
      return f.call(this, args.map(a => a.trim()).filter(Boolean));
    } catch (e) { console.error('systems', e); return say(false, 'System fault. An engineer has been notified. (There is no engineer.)'); }
  },
  usage(id) { return 'Usage: ' + LIST.find(s => s.id === id).usage; },
  event(text, toast = true) {
    this.events.push({ t: this.t, text }); if (this.events.length > 40) this.events.shift();
    const G = this.k.G; if (G.systems && G.systems.onEvent) try { G.systems.onEvent(text); } catch (e) { console.error(e); }
    if (toast) this.k.say(text, 4);
  },

  _sprinklers(a) {
    const on = [...this.wet.values()].filter(w => w.on);
    if (!a.length || a[0] === 'status') {
      const lines = [`SPRINKLERS  wet pipe, ${this.zoneList.length} zones, ${this.headCount} heads. Galleries are not on this system.`];
      if (!this.wet.size) lines.push('All valves closed. All floors dry.');
      for (const z of this.zoneList) {
        const ws = z.rooms.map(r => this.wet.get(r.id)).filter(Boolean); if (!ws.length) continue;
        const open = ws.filter(w => w.on);
        lines.push(open.length ? `  ${z.id.padEnd(13)} OPEN  ${Math.round(Math.max(...open.map(w => this.t - w.tOn)))} s of ${RUN_FOR}` : `  ${z.id.padEnd(13)} closed, floor ${Math.max(...ws.map(w => w.wet)) > SLICK ? 'WET' : 'drying'}`);
      }
      lines.push('Zones: ' + this.zoneList.map(z => z.id).join(', ') + '.');
      return say(true, lines);
    }
    const want = a[a.length - 1].toLowerCase(), what = a.length > 1 ? a.slice(0, -1).join(' ') : null;
    if (!what || (want !== 'on' && want !== 'off')) return say(false, this.usage('sprinklers'));
    const set = this.resolve(what);
    if (!set) return say(false, `No such zone: ${what}.`, 'Zones: ' + this.zoneList.map(z => z.id).join(', ') + '.');
    const ok = set.rooms.filter(r => this.cls.get(r.id)[0] !== '!');
    if (want === 'off') {
      let n = 0; for (const r of set.all ? this.k.plan.rooms : set.rooms) { const w = this.wet.get(r.id); if (w && w.on) { this._shut(w); n++; } }
      if (n) this._knock();
      return say(true, n ? `Zone ${set.label}: valve closed. ${n} room${n > 1 ? 's' : ''}. Floors will dry in about a minute.` : `Zone ${set.label}: valve already closed.`);
    }
    if (!ok.length) return say(false, this.refusal(set.rooms[0]) || [`Zone ${set.label} has no heads.`]);
    const key = set.label, rest = this.rested.get(key) || 0;
    if (rest > this.t) return say(false, `Zone ${key}: tank low. Refilling, ${Math.ceil(rest - this.t)} s.`);
    let n = 0, heads = 0;
    for (const r of ok) { const L = this._layout(r); if (!L.heads.length) continue; if (!(this.wet.get(r.id) || {}).on) n++; this._open(r, key); heads += L.heads.length / 2; }
    if (!n) return say(true, `Zone ${key}: valve already open.`);
    this._knock(); this.live = true;
    const lines = [`Zone ${key}: valve OPEN. ${ok.length} room${ok.length > 1 ? 's' : ''}, ${heads} heads. Closes itself in ${RUN_FOR} s.`, 'Floors in the zone are now wet. Patrol units are not rated for rain.'];
    if (set.all) lines.push(`${set.rooms.length - ok.length} rooms not opened: galleries, stores of works, switchrooms. They are not on this system.`);
    return say(true, lines);
  },
  _open(r, key) {
    let w = this.wet.get(r.id);
    if (!w) { w = { r, on: false, tOn: 0, tOff: -1e9, wet: 0, grow: 0, mist: 0, fx: null, puddle: null, near: false, key }; this.wet.set(r.id, w); }
    if (w.on) return;
    w.on = true; w.tOn = this.t; w.tOff = 1e9; w.key = key; w.far = 0;
  },
  _shut(w, why) {
    if (!w.on) return; w.on = false; w.tOff = this.t;
    if (why) this.rested.set(w.key, this.t + REFILL);
  },
  _knock() { const s = this.k.synth; for (const at of [0, 0.16]) { s.note(74, 0.3, { type: 'sine', vol: 0.13, at }); s.noise(0.09, { vol: 0.07, lp: 500, at }); } s.noise(0.5, { vol: 0.025, lp: 3000, at: 0.2 }); },

  _firetest(a) {
    if (!a.length || a[0] === 'status') {
      const lines = ['FIRE SUPPRESSION  galleries: inert gas (no water). Test: 20 s, beacons, light curtains, vapour at floor level.'];
      if (!this.tests.size) lines.push('No test running.');
      for (const ft of this.tests.values()) lines.push(`  ${ft.r.id.padEnd(8)} ${ft.stage === 'wait' ? 'HOLDING: gallery occupied' : ft.stage === 'run' ? `TESTING  ${Math.ceil(TEST_FOR - (this.t - ft.t0))} s` : 'clearing'}`);
      lines.push('Wings: ' + Object.keys(this.wings).sort().join(', ') + '. Or a gallery: firetest G201.');
      return say(true, lines);
    }
    if (a[0] === 'stop' || a[0] === 'abort' || a[0] === 'off') { let n = 0; for (const ft of this.tests.values()) if (ft.stage !== 'clear') { this._endTest(ft, 'stopped'); n++; } return say(true, n ? `Test stopped in ${n} room${n > 1 ? 's' : ''}. Curtains open.` : 'No test running.'); }
    const set = this.resolve(a.join(' '));
    if (!set) return say(false, `No such gallery or wing: ${a.join(' ')}.`, this.usage('firetest'));
    const rooms = set.rooms.filter(r => r.kind === 'gallery' && !r.secret && r.h >= 2.4);
    if (!rooms.length) return say(false, `${set.label} is not a gallery. It has sprinklers, or nothing. The test is for the gas system.`);
    const fresh = rooms.filter(r => !this.tests.has(r.id) && !((this.rested.get('ft:' + r.id) || 0) > this.t));
    if (!fresh.length) return say(false, this.tests.has(rooms[0].id) ? `${set.label}: test already running.` : `${set.label}: cylinders recharging, ${Math.ceil((this.rested.get('ft:' + rooms[0].id) || 0) - this.t)} s.`);
    for (const r of fresh) this._startTest(r, set.label);
    this.live = true;
    const name = set.wing ? set.wing.name : rooms[0].gallery || rooms[0].id;
    this.k.synth.chime([659.3, 523.3], { gap: 0.45, dur: 1.4, vol: 0.07 });
    this.k.say(`“Attention. A test of the fire suppression system will begin in ${name}. Please leave the gallery. This is only a test.”`, 6);
    return say(true, `${set.label}: suppression test armed, ${fresh.length} ${fresh.length > 1 ? 'galleries' : 'gallery'}. 20 s once the room is clear.`, 'Inert gas only. Vapour stays under 0.5 m, below every work. Light curtains are sensors: break one and the test aborts.', 'Patrol units in the room will halt and restart afterwards.');
  },

  _lights(a) {
    const L = this.k.G.lights, M = this.k.museum;
    if (!L) return say(false, 'Lighting controller not answering.');
    if (!a.length || a[0] === 'status') {
      const all = this.k.plan.rooms.filter(r => !r.secret && !r.shut), on = all.filter(r => L.isOn(r.id));
      return say(true, `LIGHTING  ${on.length} of ${all.length} rooms on.`, `Galleries lit: ${on.filter(r => r.kind === 'gallery').length}. Back rooms lit: ${on.filter(r => r.kind !== 'gallery').length}.`, this.usage('lights'));
    }
    const want = a[a.length - 1].toLowerCase(), what = a.slice(0, -1).join(' ');
    if (!what || (want !== 'on' && want !== 'off')) return say(false, this.usage('lights'));
    if (!L.active) return say(false, 'Lighting is locked out just now.');
    const set = this.resolve(what); if (!set) return say(false, `No such zone: ${what}.`);
    let n = 0;
    for (const r of set.rooms) { if (!M.rooms[r.id] || L.isOn(r.id) === (want === 'on')) continue; L.set(r.id, want === 'on'); n++; }      // (not kept between visits, as a thrown wall switch is: a command from the desk is for tonight)
    if (n) { const snd = this.k.sound; if (snd && snd.tick) { snd.tick(0.14, 1500, 0.018); snd.tick(0.1, 650, 0.035, 0.06); } }
    return say(true, `${set.label}: ${n} room${n === 1 ? '' : 's'} switched ${want}.${n < set.rooms.length ? ` ${set.rooms.length - n} already ${want}.` : ''}`,
      want === 'on' ? 'Patrol units see by their own lamps. Room lighting does not change what they see.' : 'The works are still there. They are simply not lit.', 'Override holds until morning.');
  },

  _lift(a) {
    const P = this.k.plan, lifts = P.lifts || [], floors = Object.entries(P.levels || {}).map(([name, y]) => ({ name, y }));
    const floorOf = y => (floors.find(f => Math.abs(f.y - y) < 0.3) || { name: y.toFixed(1) + ' m' }).name;
    const label = (l, i) => `Lift ${i + 1} (${(P.byId[l.room] && P.byId[l.room].gallery || l.id).replace(/^Gallery /, 'G')})`;
    if (!a.length || a[0] === 'status') {
      return say(true, 'LIFTS', lifts.map((l, i) => `  ${label(l, i).padEnd(34)} ${l.wait > 0 ? 'at ' + floorOf(l.stops[l.at]) : 'moving to ' + floorOf(l.stops[l.to])}   serves ${l.stops.map(floorOf).join(', ')}`), this.usage('lift'));
    }
    if (a[0] !== 'call' || !a[1]) return say(false, this.usage('lift'));
    const f = floors.find(q => q.name.toLowerCase() === a[1].toLowerCase() || (a[1].toLowerCase() === 'lower' && q.name === 'LL'));
    if (!f) return say(false, `No such floor: ${a[1]}. Floors: ${floors.map(q => q.name).join(', ')}.`);
    const only = a[2] ? parseInt(a[2], 10) - 1 : -1, lines = [];
    lifts.forEach((l, i) => {
      if (only >= 0 && i !== only) return;
      const at = l.stops.findIndex(y => Math.abs(y - f.y) < 0.3);
      if (at < 0) { if (only >= 0) lines.push(`${label(l, i)} does not stop at ${f.name}.`); return; }
      if (l.wait > 0 && l.at === at) lines.push(`${label(l, i)}: already at ${f.name}. Holding.`);
      else { l.to = at; l.dir = Math.sign(at - l.at) || 1; l.wait = 0; lines.push(`${label(l, i)}: called to ${f.name}.`); }
      this.calls = this.calls.filter(c => c.l !== l); this.calls.push({ l, at, until: this.t + 60, here: false });
    });
    if (!lines.length) return say(false, only >= 0 ? `No such lift: ${a[2]}.` : `No lift stops at ${f.name}.`);
    this.live = true; if (this.k.sound && this.k.sound.bell) this.k.sound.bell(880, 0, 0.04, 0.8, 0.5);
    return say(true, lines, 'It will wait there about half a minute.');
  },

  _doors(a) {
    const P = this.k.plan, outs = P.doors.filter(d => (d.out || d.b === 'out') && !d.vent && !d.hidden), vents = (P.holes || []).filter(h => h.kind !== 'inner');
    const name = d => ((P.byId[d.a] && P.byId[d.a].gallery) || d.a).replace(/^Gallery /, 'G');
    if (!a.length || a[0] === 'status') {
      const st = P.locked ? 'LOCKED' : 'UNLOCKED  (released from inside; no key holder on record)';
      return say(true, `DOORS  ${outs.length} outside doors.`, outs.map((d, i) => `  ${String(i + 1).padStart(2)}  ${name(d).padEnd(26)} ${d === P.front ? 'FRONT  ' : ''}${st}`),
        `  ${vents.length} vents, ducts, flaps and propped windows: not on the system.`, P.locked ? 'The building is secure.' : 'The building is secure, apart from the doors.');
    }
    if (a[0] === 'unlock') {
      if (/^staff/i.test(a[1] || '')) return say(false, 'STAFF ENTRANCE: on the drawings (Sub-level 1, room BLL-1). No door to the street was ever built there.', 'Staff use the front door, like everybody else. Request declined.');
      if (!a[1]) return say(false, this.usage('doors'));
      return say(false, P.locked ? `Door ${a[1]}: unlocking needs a key holder on site. There is no key holder on site.` : `Door ${a[1]}: already unlocked. Nobody has told this system why.`);
    }
    if (a[0] === 'lock') return say(false, P.locked ? 'Already locked.' : 'Locking needs a key holder to walk the doors. There is no key holder on site.', 'Request logged.');
    return say(false, this.usage('doors'));
  },

  _pa(a) {
    if (!a.length || a[0] === 'status' && a.length === 1) return say(true, 'PUBLIC ADDRESS  all zones, one channel.', this.pa.text ? `Last announcement: “${this.pa.text}”` : 'No announcements tonight.', this.usage('pa'));
    const text = a.join(' ').replace(/^["'“]|["'”]$/g, '').slice(0, 120), G = this.k.G;
    this.pa = { until: this.t + 4.5, text }; this.live = true;
    const snd = this.k.sound; if (snd && snd.bell) [0, 0.32, 0.64].forEach((at, i) => snd.bell([783.99, 659.25, 523.25][i], (snd.ctx ? snd.ctx.currentTime : 0) + at, 0.05, 1.6, 0.9));
    this.k.say(`♪  “${text}”`, 5);
    const gf = this._guards(), bots = gf && G.set.guards !== false ? gf.bots || [] : [];
    for (const b of bots) if (!b.sys) { b.sys = { kind: 'pa', until: this.t + 4.5 }; this.busy.add(b); }
    const lines = [`Announced in all zones: “${text}”`, bots.length ? `${bots.length} patrol units acknowledged.` : 'No patrol units acknowledged.'];
    if (/\bdo(ugh)?nuts?\b/i.test(text) && bots.length) {
      const c = this._ctrl(), free = bots.filter(b => (!b.sys || b.sys.kind === 'pa') && (b.mode === 'patrol' || b.mode === 'scan'));
      if (c && free.length) {
        const b = free.reduce((m, q) => (Math.hypot(q.x - c.x, q.z - c.z) + Math.abs(q.fy - c.y) * 4 < Math.hypot(m.x - c.x, m.z - c.z) + Math.abs(m.fy - c.y) * 4 ? q : m));
        b.sys = { kind: 'donuts', stage: 'called', t: this.t, g0: b.g, fy0: b.fy, c }; this.busy.add(b);
        lines.push(`Unit ${String(b.P.id).toUpperCase()} has gone off duty and is on its way to the control room. Its patch (${b.P.rooms.join(', ')}) is unattended.`, 'A unit off duty takes no notice of anything but donuts.');
      } else lines.push('No unit is free to come. There are no donuts.');
    }
    return say(true, lines);
  },

  state() {
    const P = this.k.plan, L = this.k.G.lights, open = [], wet = [];
    for (const z of this.zoneList) { if (z.rooms.some(r => this.wet.get(r.id)?.on)) open.push(z.id); else if (z.rooms.some(r => (this.wet.get(r.id)?.wet || 0) > SLICK)) wet.push(z.id); }
    return {
      sprinklers: { open, wet, rooms: [...this.wet.values()].map(w => ({ id: w.r.id, on: w.on, wet: +w.wet.toFixed(2), left: w.on ? Math.max(0, Math.round(RUN_FOR - (this.t - w.tOn))) : 0 })) },
      firetest: [...this.tests.values()].map(ft => ({ id: ft.r.id, stage: ft.stage, left: ft.stage === 'run' ? Math.max(0, Math.round(TEST_FOR - (this.t - ft.t0))) : null })),
      lights: L ? { on: P.rooms.filter(r => !r.secret && !r.shut && L.isOn(r.id)).length, rooms: P.rooms.filter(r => !r.secret && !r.shut).length } : null,
      lifts: (P.lifts || []).map((l, i) => ({ n: i + 1, id: l.id, y: +l.y.toFixed(2), moving: !(l.wait > 0), called: this.calls.some(c => c.l === l) })),
      doors: { locked: !!P.locked, outside: P.doors.filter(d => (d.out || d.b === 'out') && !d.vent && !d.hidden).length },
      pa: this.pa.text || null,
      robots: [...this.busy].map(b => ({ id: b.P.id, doing: b.sys ? b.sys.kind + (b.sys.stage ? ':' + b.sys.stage : '') : null })),
    };
  },

  // ---------------------------------------------------------------- what the floor is like
  wetAt(x, z, y) { for (const w of this.wet.values()) { const r = w.r; if (x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1 && Math.abs(y - r.y) < 1.5) return w.on ? Math.max(w.wet, 0.5) : w.wet; } return 0; },
  rainAt(x, z, y) { for (const w of this.wet.values()) { const r = w.r; if (w.on && this.t - w.tOn > 0.8 && x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1 && Math.abs(y - r.y) < 1.5) return true; } return false; },

  // ---------------------------------------------------------------- each frame
  update(dt, k) {
    const G = k.G, cam = G.testEye ? (this._eye || (this._eye = new THREE.Vector3())).fromArray(G.testEye.at) : G.camera.position;      // (a test eye is put in place after this: src/main.js)
    this.t += dt;
    if (this.auto && this.t > 1.5) { const list = this.auto; this.auto = null; for (const [id, ...args] of list) console.log('sys', id, args.join(' '), JSON.stringify(this.run(id.toLowerCase(), args).lines)); }
    if ((this.tick = (this.tick + 1) % 12) === 0) this._headsNear(cam);
    if (!this.live) return;
    const U = this.U, slow = this.tick % 12 === 0;
    this._made = false;
    U.uTime.value = this.t;
    const v = k.v, L = G.lamp;
    if (L && v) { const s = Math.sin(v.yaw), c = Math.cos(v.yaw); U.uLampPos.value.set(v.pos.x + s * 0.2, v.pos.y + (v.kind === 'drone' ? 0 : 0.14), v.pos.z + c * 0.2); U.uLampDir.value.set(s, -0.06, c).normalize(); U.uLampK.value = L.intensity > 0.5 ? Math.min(1, L.intensity / 70) : 0; U.uLampCos.value = Math.cos(Math.min(1.2, (L.angle || 0.6) * 0.95)); }
    // ---- rain and wet floors
    let hiss = 0;
    for (const w of this.wet.values()) {
      const r = w.r;
      if (w.on) {
        w.wet = Math.min(1, w.wet + dt / 3); w.grow = Math.min(1, w.grow + dt / 7);
        if (this.t - w.tOn > RUN_FOR) { this._shut(w, true); if (!this._told || this._told !== w.key + w.tOn) { this._told = w.key + w.tOn; this._knock(); this.event(`Sprinklers, zone ${w.key}: valve closed, tank low.`); } }
      } else w.wet = Math.max(0, w.wet - dt / DRY_FOR);
      w.mist += ((w.on ? 1 : 0) - w.mist) * Math.min(1, dt * (w.on ? 0.3 : 0.12));
      // Slippery: the car's own wet floor (src/vehicles.js reads plan.puddles; a rectangle is a puddle too).
      const slick = (w.on && this.t - w.tOn > 1.2) || (!w.on && w.wet > SLICK);
      if (slick && !w.puddle) { w.puddle = { x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y: r.y, systems: true }; k.plan.puddles.push(w.puddle); }
      else if (!slick && w.puddle) { const i = k.plan.puddles.indexOf(w.puddle); if (i >= 0) k.plan.puddles.splice(i, 1); w.puddle = null; }
      if (slow) {
        const dx = Math.max(r.x0 - cam.x, 0, cam.x - r.x1), dz = Math.max(r.z0 - cam.z, 0, cam.z - r.z1);
        w.near = dx * dx + dz * dz < NEAR * NEAR && cam.y > r.y - 6 && cam.y < r.y + r.h + 7;
        if (w.near && !w.fx) this._rainFx(w);
        if (w.fx) { w.fx.group.visible = w.near; const st = k.museum.rooms[r.id], lum = st ? Math.max(st.work || 0, st.wake || 0) : 0; w.fx.col.setRGB(0.3 + 0.5 * lum, 0.36 + 0.56 * lum, 0.46 + 0.62 * lum); }
      }
      if (w.fx && w.near) { const f = w.fx; f.rain.uOn.value = w.tOn; f.rain.uOff.value = w.tOff; f.rain.mesh.visible = this.t - w.tOff < DRIP_FOR + 4; f.floor.uGrow.value = w.grow; f.floor.uWet.value = w.wet; f.floor.uRain.value = w.on ? smooth((this.t - w.tOn - 0.5) / 2) : Math.max(0, 1 - (this.t - w.tOff) / 1.5); f.floor.uDripK.value = w.on ? 0 : Math.max(0, 1 - (this.t - w.tOff) / DRIP_FOR); f.mist.uK.value = 0.1 * w.mist; f.mist.mesh.visible = w.mist > 0.01; }
      if (w.on) { const p = v.pos, dx = Math.max(r.x0 - p.x, 0, p.x - r.x1), dz = Math.max(r.z0 - p.z, 0, p.z - r.z1), d = Math.hypot(dx, dz) + Math.abs(p.y - r.y) * 2; hiss = Math.max(hiss, 1 - d / 26); }
      if (!w.on && w.wet <= 0 && this.t - w.tOff > DRIP_FOR + 4) { if (w.fx) this._dispose(w.fx); this.wet.delete(r.id); }
    }
    this._hiss(hiss);
    this._spray(dt, v);
    // ---- fire tests
    for (const ft of this.tests.values()) this._stepTest(ft, dt, slow, cam, v);
    // ---- lifts called: held where they were called to
    for (const c of this.calls) { const l = c.l; if (l.wait > 0 && l.at === c.at) { if (!c.here) { c.here = true; c.until = Math.min(c.until, this.t + 30); } const aboard = v.pos.x > l.x0 && v.pos.x < l.x1 && v.pos.z > l.z0 && v.pos.z < l.z1 && Math.abs(v.pos.y - l.y) < 0.4; if (aboard) c.until = 0; else l.wait = Math.max(l.wait, 2); } else if (l.wait > 0 && !c.here && l.at !== c.at) { l.to = c.at; l.dir = Math.sign(c.at - l.at) || 1; l.wait = 0; } }
    if (this.calls.length) this.calls = this.calls.filter(c => c.until > this.t);
    // ---- the robots it has a hold of: what shows (their own drawing has just been done, src/guards.js)
    for (const b of this.busy) {
      let s = b.sys; const gf = this._guards();
      if (s && (!gf || !gf.wasOn || (s.until !== undefined && s.until !== Infinity && this.t > s.until + 1.5))) { this._free(b); s = null; }
      if (!s) { if (b.head) b.head.rotation.x = 0; this.busy.delete(b); continue; }
      let droop = 0, dark = false;
      if (s.kind === 'frozen') { const boot = s.until !== Infinity ? 1 - (s.until - this.t) / REBOOT : 0; droop = 0.32 * (1 - smooth((boot - 0.6) / 0.4)); dark = boot < 0.6 || (!G.set.reduce && Math.sin(this.t * 37) > 0.2); }
      else if (s.kind === 'pa') droop = -0.3 * smooth(Math.min(this.t - (s.until - 4.5), s.until - this.t) / 0.5);
      else if (s.kind === 'rain' && (this.rainAt(b.x, b.z, b.fy) || s.stage === 'flee')) dark = !G.set.reduce && (Math.sin(this.t * 31 + b.i) * Math.sin(this.t * 13.7 + b.i * 2) > 0.1);
      if (b.head) b.head.rotation.x = droop;
      if (dark && b.pool) b.pool.visible = false;
    }
    this.live = this.wet.size > 0 || this.tests.size > 0 || this.busy.size > 0 || this.calls.length > 0 || this.pa.until > this.t || this.sprayLive > 0;
    this.level.visible = this.live;
    if (!this.live) this._hiss(0, true);
  },
  _hiss(k, stop) {
    if (!this.snd) { if (k <= 0) return; this.snd = { hiss: this.k.loop({ lp: 6500, hp: 1400 }), patter: this.k.loop({ lp: 1100, hp: 180 }) }; }
    if (stop) { this.snd.hiss.stop(); this.snd.patter.stop(); return; }
    k = clamp(k, 0, 1); this.snd.hiss.set(0.035 * k * k, 0.4); this.snd.patter.set(0.05 * k, 0.4);
  },

  // ---------------------------------------------------------------- a raining room, drawn
  _mat(vs, fs, uniforms) { return artSafe(new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms: { ...this.U, ...uniforms }, side: THREE.DoubleSide })); },
  _rainFx(w) {
    const r = w.r, L = this._layout(r), G = this.k.G, rnd = dice(hash(r.id)), col = new THREE.Color(0.3, 0.36, 0.46);
    const group = new THREE.Group(); group.name = 'rain ' + r.id;
    const sphere = new THREE.Sphere(new THREE.Vector3((r.x0 + r.x1) / 2, r.y + r.h / 2, (r.z0 + r.z1) / 2), Math.hypot(r.x1 - r.x0, r.h, r.z1 - r.z0) / 2 + 0.5);
    const lo = new THREE.Vector2(r.x0 + 0.12, r.z0 + 0.12), hi = new THREE.Vector2(r.x1 - 0.12, r.z1 - 0.12);
    // rain
    const nh = L.heads.length / 2, per = Math.max(6, Math.min(PER_HEAD, Math.floor(MAX_DROPS / nh))), n = nh * per;
    const aHead = new Float32Array(n * 3), aSeed = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { const h = Math.floor(i / per) * 2; aHead[i * 3] = L.heads[h]; aHead[i * 3 + 1] = L.y - 0.14; aHead[i * 3 + 2] = L.heads[h + 1]; for (let q = 0; q < 4; q++) aSeed[i * 4 + q] = rnd(); }
    const rainU = { uOn: { value: w.tOn }, uOff: { value: w.tOff }, uFloor: { value: r.y }, uR: { value: SPRAY }, uDrip: { value: DRIP_FOR }, uLo: { value: lo }, uHi: { value: hi }, uCol: { value: col } };
    const rain = new THREE.Mesh(instanced(QUAD, [['aHead', aHead, 3], ['aSeed', aSeed, 4]], n), this._mat(RAIN_V, RAIN_F, rainU));
    rain.renderOrder = 5;                 // (all of it after the game's own added lights, renderOrder 4, and after the alpha is levelled, 4.5)
    // the floor
    const pos = [], idx = [], y = r.y + 0.016;
    for (const c of carve(r, this.k.plan.wells.filter(q => Math.abs(q.y - r.y) < 0.02))) { const o = pos.length / 3; pos.push(c.x0, y, c.z0, c.x1, y, c.z0, c.x1, y, c.z1, c.x0, y, c.z1); idx.push(o, o + 2, o + 1, o, o + 3, o + 2); }
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fg.setIndex(idx);
    const M = G.mirror;
    const floorU = { tRefl: { value: M ? M.rt.texture : null }, reflMatrix: { value: M ? M.matrix : new THREE.Matrix4() }, reflOn: M ? M.strength : { value: 0 }, reflY: M ? M.level : { value: 0 }, uHide: { value: 0 }, uFloor: { value: r.y },
      uGrow: { value: 0 }, uWet: { value: 0 }, uRain: { value: 0 }, uDripK: { value: 0 }, uR: { value: SPRAY }, uGrid: { value: new THREE.Vector4(r.x0, r.z0, L.cw, L.cd) }, uCol: { value: col } };
    const floor = new THREE.Mesh(fg, this._mat(FLOOR_V, FLOOR_F, floorU));
    floor.material.polygonOffset = true; floor.material.polygonOffsetFactor = -1; floor.material.polygonOffsetUnits = -1; floor.renderOrder = 5;
    if (M) floor.onBeforeRender = renderer => { floorU.uHide.value = renderer.getRenderTarget() === M.rt ? 1 : 0; floor.material.uniformsNeedUpdate = true; };      // not in the floor's own mirror
    // mist
    const area = (r.x1 - r.x0) * (r.z1 - r.z0), wide = Math.min(1, (Math.min(r.x1 - r.x0, r.z1 - r.z0) - 0.3) / 2.6), m = clamp(Math.round(area / (PHONE ? 5 : 3)), 8, PHONE ? 60 : 110);
    const aA = new Float32Array(m * 4), aS = new Float32Array(m * 4);
    for (let i = 0; i < m; i++) { const a = rnd() * TAU; aA[i * 4] = r.x0 + rnd() * (r.x1 - r.x0); aA[i * 4 + 1] = r.z0 + rnd() * (r.z1 - r.z0); aA[i * 4 + 2] = Math.cos(a); aA[i * 4 + 3] = Math.sin(a); for (let q = 0; q < 4; q++) aS[i * 4 + q] = rnd(); }
    const mistU = { uK: { value: 0 }, uFront: { value: 1 }, uFloor: { value: r.y }, uTop: { value: 0.44 }, uSpeed: { value: 0.12 }, uLife: { value: 7 }, uWide: { value: wide }, uLo: { value: lo }, uHi: { value: hi }, uCol: { value: col } };
    const mist = new THREE.Mesh(instanced(QUAD2, [['aA', aA, 4], ['aS', aS, 4]], m), this._mat(PUFF_V, PUFF_F, mistU));
    mist.renderOrder = 5;
    for (const q of [rain, floor, mist]) { q.geometry.boundingSphere = sphere; q.matrixAutoUpdate = false; group.add(q); }
    this.fx.add(group);
    w.fx = { group, col, rain: { mesh: rain, ...rainU }, floor: { mesh: floor, ...floorU }, mist: { mesh: mist, ...mistU } };
  },
  _dispose(fx) { fx.group.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } }); for (const t of fx.textures || []) if (t) t.dispose(); this.fx.remove(fx.group); },

  // Spray off the wheels of a car on a wet floor: a few dozen short streaks thrown up behind it.
  _spray(dt, v) {
    const wetCar = v.kind === 'car' && v.wet && !v.air && this.wetAt(v.pos.x, v.pos.z, v.pos.y) > 0, sp = wetCar ? Math.hypot(v.vel.x, v.vel.z) : 0;
    if (!this.spray) {
      if (sp < 1.2) { this.sprayLive = 0; return; }
      const n = 48, p = new Float32Array(n * 3).fill(-999), vel = new Float32Array(n * 3), a = new Float32Array(n);
      const g = instanced(QUAD, [['aP', p, 3], ['aV', vel, 3], ['aL', a, 1]], n); for (const name of ['aP', 'aV', 'aL']) g.attributes[name].setUsage(THREE.DynamicDrawUsage);
      const mesh = new THREE.Mesh(g, this._mat(/* glsl */`attribute vec3 aP; attribute vec3 aV; attribute float aL; varying vec2 vQ; varying float vA; varying float vLamp; ${LAMP_PARS}
        void main() { vQ = position.xy; vec3 d = normalize(aV + vec3(0.0, 1e-4, 0.0)); vec3 toCam = cameraPosition - aP; float dist = length(toCam); vec3 side = normalize(cross(d, toCam));
          vec3 wp = aP - d * clamp(length(aV) * 0.03, 0.02, 0.12) * position.y + side * max(0.005, dist * 0.001) * position.x; vA = aL; vLamp = lampAt(aP); gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0); }`, RAIN_F, { uCol: { value: new THREE.Color(0.5, 0.58, 0.7) } }));
      mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; mesh.renderOrder = 5; this.fx.add(mesh);
      this.spray = { mesh, p, vel, a, life: new Float32Array(n), i: 0, acc: 0, n };
    }
    const s = this.spray; let alive = 0;
    if (sp > 1.2) {
      s.acc += dt * Math.min(60, sp * 9);
      const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw), slip = Math.min(1, (v.slip || 0) / 2);
      while (s.acc >= 1) {
        s.acc -= 1; const i = s.i = (s.i + 1) % s.n, side = Math.random() < 0.5 ? -1 : 1, back = Math.random() < 0.7 ? -0.14 : 0.14;
        s.p[i * 3] = v.pos.x + fx * back - fz * side * 0.09; s.p[i * 3 + 1] = v.pos.y + 0.03; s.p[i * 3 + 2] = v.pos.z + fz * back + fx * side * 0.09;
        const out = (Math.random() - 0.5) * (0.8 + 2 * slip), k = 0.25 + Math.random() * 0.3;
        s.vel[i * 3] = v.vel.x * k * -0.6 - fz * out + fx * -0.3; s.vel[i * 3 + 1] = 0.7 + Math.random() * (0.6 + sp * 0.12); s.vel[i * 3 + 2] = v.vel.z * k * -0.6 + fx * out + fz * -0.3;
        s.life[i] = 0.3 + Math.random() * 0.3;
      }
    }
    for (let i = 0; i < s.n; i++) {
      if (s.life[i] <= 0) { s.a[i] = 0; continue; }
      alive++; s.life[i] -= dt; s.vel[i * 3 + 1] -= 9.8 * dt;
      for (let q = 0; q < 3; q++) s.p[i * 3 + q] += s.vel[i * 3 + q] * dt;
      s.a[i] = Math.min(1, s.life[i] * 5) * 0.9;
    }
    this.sprayLive = alive; s.mesh.visible = alive > 0;
    if (alive || s.dirty) { const at = s.mesh.geometry.attributes; at.aP.needsUpdate = at.aV.needsUpdate = at.aL.needsUpdate = true; s.dirty = alive > 0; }
  },

  // ---------------------------------------------------------------- the fire test
  _startTest(r, label) {
    const k = this.k, st = k.museum.rooms[r.id];
    // The vapour's ceiling: half a metre, or under the lowest thing hung or stood in the room, whichever is lower.
    let low = Infinity;
    for (const a of (st ? st.arts : [])) low = Math.min(low, (a.obj ? (a.fy || r.y) + (a.plinth || 0) : a.y - a.h / 2 - (a.frame || 0)) - r.y);
    const cap = Math.min(VAPOUR_TOP, low - UNDER);
    const doors = k.plan.doorsOf(r.id).filter(d => !d.hidden && !d.vent && !d.shut && !(d.out || d.b === 'out') && Math.abs(d.y - r.y) < 0.3);
    const ft = { r, label, stage: 'wait', t0: 0, tw: this.t, cap, low, doors, bars: [], fx: null, near: false, press: 0, k: 0, curtain: 0 };
    this.tests.set(r.id, ft);
  },
  _stepTest(ft, dt, slow, cam, v) {
    const r = ft.r, k = this.k, P = k.plan, t = this.t, p = v.pos;
    if (ft.stage === 'wait') {
      ft.k = Math.min(1, ft.k + dt * 2);
      // Not while anybody is in there, or in one of its doorways: it waits, and gives up after a while.
      const inRoom = p.x > r.x0 - 0.5 && p.x < r.x1 + 0.5 && p.z > r.z0 - 0.5 && p.z < r.z1 + 0.5 && p.y > r.y - 0.5 && p.y < r.y + r.h + 0.5;
      const inDoor = ft.doors.some(d => p.x > d.x0 - 0.7 && p.x < d.x1 + 0.7 && p.z > d.z0 - 0.7 && p.z < d.z1 + 0.7 && p.y > d.y - 0.5 && p.y < d.y + d.h + 0.5);
      if (!inRoom && !inDoor && t - ft.tw > 2.5) {
        ft.stage = 'run'; ft.t0 = t;
        for (const d of ft.doors) { const x = d.along === 'x', mx = (d.x0 + d.x1) / 2, mz = (d.z0 + d.z1) / 2; const o = x ? { x0: mx - 0.03, x1: mx + 0.03, z0: d.z0, z1: d.z1 } : { x0: d.x0, x1: d.x1, z0: mz - 0.03, z1: mz + 0.03 }; Object.assign(o, { y0: d.y, y1: d.y + d.h, curtain: true }); P.obstacles.push(o); ft.bars.push(o); }
        k.synth.noise(1.6, { vol: 0.04, lp: 5000 });
      } else if (t - ft.tw > TEST_WAIT) { this.event(`Suppression test, ${r.id}: abandoned. Gallery occupied.`, this._last !== ft.label + 'occ'); this._last = ft.label + 'occ'; this._endTest(ft, 'occupied'); }
    } else if (ft.stage === 'run') {
      const e = t - ft.t0;
      ft.curtain = Math.min(1, ft.curtain + dt * 3);
      ft.k = smooth(e / 3) * (1 - smooth((e - (TEST_FOR - 4.5)) / 4.5));
      // The curtain is a sensor: lean on it and the test is over. Nothing is ever shut in.
      let touch = false; const rad = (v.radius || 0.19) + 0.07;
      for (const o of ft.bars) {
        if (!(p.y + 0.3 > o.y0 && p.y - 0.2 < o.y1)) { o.side = 0; continue; }
        if (p.x > o.x0 - rad && p.x < o.x1 + rad && p.z > o.z0 - rad && p.z < o.z1 + rad) touch = true;
        // (A curtain is thin, and a fast toy on a slow frame steps clean over a thin thing: so which side of it the toy
        // is on is remembered, and a toy found on the other side within the doorway is put back where it came from.)
        const ax = o.x1 - o.x0 < o.z1 - o.z0, mid = ax ? (o.x0 + o.x1) / 2 : (o.z0 + o.z1) / 2, u = ax ? p.x : p.z, w = ax ? p.z : p.x, w0 = ax ? o.z0 : o.x0, w1 = ax ? o.z1 : o.x1;
        const side = Math.sign(u - mid) || 1, within = w > w0 - 0.25 && w < w1 + 0.25 && Math.abs(u - mid) < 2.5;
        if (within && o.side && side !== o.side) { const back = mid + o.side * (rad - 0.02); if (ax) { p.x = back; v.vel.x = 0; } else { p.z = back; v.vel.z = 0; } touch = true; ft.press += 0.25; }
        else o.side = within ? side : 0;
      }
      ft.press = touch ? ft.press + dt : Math.max(0, ft.press - dt * 2);
      if (ft.press > 0.45) { this.event(`Suppression test, ${r.id}: ABORTED. Light curtain broken.`); this._endTest(ft, 'broken'); }
      else if (e >= TEST_FOR) { if (this._last !== ft.label + ft.t0.toFixed(0)) { this._last = ft.label + ft.t0.toFixed(0); k.synth.chime([523.3, 659.3], { gap: 0.45, dur: 1.4, vol: 0.07 }); this.event(`Suppression test, ${ft.label}: complete. Curtains open. Patrol units restarting.`); } this._endTest(ft, 'done'); }
    } else {
      ft.curtain = Math.max(0, ft.curtain - dt * 4); ft.k = Math.max(0, ft.k - dt / 2.5);
      if (ft.k <= 0 && t - ft.tEnd > 3) { if (ft.fx) this._dispose(ft.fx); this.tests.delete(r.id); return; }
    }
    if (slow) {
      const dx = Math.max(r.x0 - cam.x, 0, cam.x - r.x1), dz = Math.max(r.z0 - cam.z, 0, cam.z - r.z1);
      ft.near = dx * dx + dz * dz < 40 * 40 && cam.y > r.y - 6 && cam.y < r.y + r.h + 7;
      if (ft.near && !ft.fx && !this._made) { this._made = true; this._testFx(ft); }      // (one room a tick: finding what each doorway can see takes a few milliseconds)
      if (ft.fx) { ft.fx.group.visible = ft.near; const st = k.museum.rooms[r.id], g = 0.3 + 0.7 * (st ? Math.max(st.work || 0, st.wake || 0) : 0); if (ft.fx.vap) ft.fx.vap.uCol.value.setRGB(0.47 * g, 0.5 * g, 0.55 * g); }
    }
    if (ft.fx && ft.near) { const f = ft.fx; f.glow.uK.value = ft.stage === 'run' ? 1 : ft.k; f.glow.uCurtain.value = ft.curtain; f.glow.uCalm.value = k.G.set.reduce ? 1 : 0; if (f.vap) { f.vap.uK.value = ft.stage === 'wait' ? 0 : ft.k; f.vap.uFront.value = ft.stage === 'run' ? Math.min(1, (this.t - ft.t0) / 9) : ft.stage === 'wait' ? 0 : f.vap.uFront.value; f.vap.uShimmer.value = k.G.set.reduce ? 0 : 1; f.vap.mesh.visible = f.vap.uK.value > 0.002; } }
  },
  _endTest(ft, why) {
    const P = this.k.plan;
    for (const o of ft.bars) { const i = P.obstacles.indexOf(o); if (i >= 0) P.obstacles.splice(i, 1); }
    ft.bars = []; ft.stage = 'clear'; ft.tEnd = this.t; ft.why = why;
    this.rested.set('ft:' + ft.r.id, this.t + (why === 'occupied' ? 5 : TEST_REST));
  },
  _testAt(x, z, y) { for (const ft of this.tests.values()) { const r = ft.r; if (ft.stage === 'run' && x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1 && Math.abs(y - r.y) < 1.5) return ft; } return null; },
  _testFx(ft) {
    const r = ft.r, P = this.k.plan, st = this.k.museum.rooms[r.id], arts = st ? st.arts : [], rnd = dice(hash('ft' + r.id));
    const group = new THREE.Group(); group.name = 'fire test ' + r.id;
    const sphere = new THREE.Sphere(new THREE.Vector3((r.x0 + r.x1) / 2, r.y + r.h / 2, (r.z0 + r.z1) / 2), Math.hypot(r.x1 - r.x0, r.h, r.z1 - r.z0) / 2 + 1.5);
    // Beacons over each doorway (both faces of the wall), the beams across it, and a slit for each vent at the skirting.
    const quads = [], AMBER = [2.6, 1.15, 0.12], RED = [2.2, 0.5, 0.1], PALE = [0.75, 0.85, 1.0];
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), Sc = new THREE.Vector3();
    const put = (x, y, z, yaw, w, h, col, mode) => quads.push({ m: M.compose(V.set(x, y, z), Q.setFromEuler(E.set(0, yaw, 0)), Sc.set(w, h, 1)).clone(), c: [...col, mode] });
    for (const d of ft.doors) {
      const x = d.along === 'x', mx = (d.x0 + d.x1) / 2, mz = (d.z0 + d.z1) / 2, wid = x ? d.z1 - d.z0 : d.x1 - d.x0, top = d.y + d.h;
      for (const s of [-1, 1]) {
        const other = [P.byId[d.a], P.byId[d.b]].find(q => q && Math.sign((x ? (q.x0 + q.x1) / 2 - mx : (q.z0 + q.z1) / 2 - mz)) === s), hgt = other ? other.y + other.h : top + 1;
        const y = Math.min(top + 0.42, hgt - 0.12); if (y < top + 0.05) continue;
        const face = x ? (s < 0 ? d.x0 : d.x1) + s * 0.03 : (s < 0 ? d.z0 : d.z1) + s * 0.03;
        put(x ? face : mx, y, x ? mz : face, x ? s * Math.PI / 2 : (s < 0 ? Math.PI : 0), Math.min(0.7, wid * 0.4), 0.14, AMBER, 0);
      }
      const n = Math.max(4, Math.round(d.h / 0.42));
      for (let i = 0; i < n; i++) put(mx, d.y + 0.07 + (d.h - 0.2) * i / (n - 1), mz, x ? Math.PI / 2 : 0, wid, 0.07, RED, 1);
    }
    // Vents: along the walls between the doorways, at skirting height. (Where the vapour comes from.)
    const vents = [];
    for (const w of P.walls.filter(q => q.room === r)) for (const sg of w.segs || []) {
      const len = sg.hi - sg.lo; if (len < 1.6) continue;
      const n = Math.max(1, Math.round(len / 3.2));
      for (let i = 0; i < n; i++) { const u = sg.lo + len * (i + 0.5) / n, x = w.horiz ? u : w.fixed + w.nx * 0.03, z = w.horiz ? w.fixed + w.nz * 0.03 : u; vents.push({ x, z, nx: w.nx, nz: w.nz }); if (ft.cap >= 0.12) put(x, r.y + 0.1, z, Math.atan2(w.nx, w.nz), 0.42, 0.07, PALE, 2); }
    }
    const glowU = { uK: { value: 0 }, uCurtain: { value: 0 }, uCalm: { value: 0 } };
    // The works these could be seen in front of: every one with a line of sight to one of this room's doorways.
    const list = this._seenFrom(r, ft.doors).slice(0, MAXG), gd = new Float32Array(Math.max(1, list.length) * 12);
    list.forEach((a, i) => {
      const o = i * 12;
      if (a.obj) { gd.set([a.x, a.y, a.z, 1], o); gd.set([Math.max(a.w / 2, a.half || 0), a.h / 2, 0, 0], o + 8); }
      else { gd.set([a.x, a.y, a.z, 0], o); gd.set([Math.cos(a.rot), -Math.sin(a.rot), a.nx, a.nz], o + 4); gd.set([a.w / 2, a.h / 2, 0, 0], o + 8); }
    });
    const gt = new THREE.DataTexture(gd, 3, Math.max(1, list.length), THREE.RGBAFormat, THREE.FloatType); gt.minFilter = gt.magFilter = THREE.NearestFilter; gt.needsUpdate = true;
    ft.guarded = list.length; ft.unguarded = this._seenFrom(r, ft.doors).length - list.length;
    glowU.uG = { value: gt }; glowU.uGN = { value: list.length };
    const glow = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), this._mat(GLOW_V, GLOW_F, glowU), quads.length);
    const aC = new Float32Array(quads.length * 4); quads.forEach((q, i) => { glow.setMatrixAt(i, q.m); aC.set(q.c, i * 4); });
    glow.geometry.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4)); glow.frustumCulled = false; glow.renderOrder = 6; group.add(glow);
    // The vapour, if there is room for it under the lowest work: one box over the floor (FOG_V, FOG_F).
    let vap = null;
    if (ft.cap >= 0.12 && vents.length) {
      const lo = new THREE.Vector2(r.x0 + 0.1, r.z0 + 0.1), hi = new THREE.Vector2(r.x1 - 0.1, r.z1 - 0.1);
      // The little map of the room: a tongue of gas out from each vent, and nothing at a doorway (it does not spill, and it has no cut edge there).
      const N = 64, md = new Uint8Array(N * N * 4), sm = (a, b, v) => smooth((v - a) / (b - a));
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const x = lo.x + (i + 0.5) / N * (hi.x - lo.x), z = lo.y + (j + 0.5) / N * (hi.y - lo.y);
        let tongue = 0, open = 1;
        for (const q of vents) { const ox = x - q.x, oz = z - q.z, out = ox * q.nx + oz * q.nz; if (out < -0.2) continue; const lat = oz * q.nx - ox * q.nz, wd = 0.55 + 0.22 * Math.max(0, out); tongue = Math.max(tongue, Math.exp(-lat * lat / (wd * wd)) * Math.exp(-Math.max(0, out) / 3.4)); }
        for (const d of ft.doors) { const cx = clamp(x, d.x0, d.x1), cz = clamp(z, d.z0, d.z1); open = Math.min(open, sm(0.3, 1.8, Math.hypot(x - cx, z - cz))); }
        const o = (j * N + i) * 4; md[o] = Math.round(tongue * 255); md[o + 1] = Math.round(open * 255); md[o + 3] = 255;
      }
      const map = new THREE.DataTexture(md, N, N, THREE.RGBAFormat, THREE.UnsignedByteType); map.minFilter = map.magFilter = THREE.LinearFilter; map.needsUpdate = true;
      const vapU = { uK: { value: 0 }, uFront: { value: 0 }, uFloor: { value: r.y }, uTop: { value: ft.cap }, uSteps: { value: PHONE ? 6 : 12 }, uShimmer: { value: 1 }, uLo: { value: lo }, uHi: { value: hi }, uCol: { value: new THREE.Color(0.3, 0.32, 0.35) }, uNoise: { value: cloudTex() }, uVent: { value: map } };
      const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0.5, 0.5, 0.5); box.boundingSphere = sphere;
      // (Its far faces are the ones drawn, the floor of the box and the sides beyond: each line of sight leaves by one of them, once.
      // The near ones would do as well, but the top is a hand's breadth under a low camera and inside its near plane. And so
      // what stands in the gas hides the gas behind it, as it should, rather than being veiled by it.)
      const mat = this._mat(FOG_V, FOG_F, vapU); mat.side = THREE.BackSide;
      const mesh = new THREE.Mesh(box, mat); mesh.matrixAutoUpdate = false; mesh.renderOrder = 5; group.add(mesh);
      vap = { mesh, map, ...vapU };
    }
    this.fx.add(group);
    ft.fx = { group, glow: { mesh: glow, ...glowU }, vap, textures: [gt, vap && vap.map] };
  },

  // ---------------------------------------------------------------- what a doorway can see
  // The walls of one level, in order, each with the stretches of it that are open (its doorways).
  _wallsAt(y) {
    const key = Math.round(y * 2), all = this._wl || (this._wl = new Map()); let W = all.get(key); if (W) return W;
    W = { H: [], V: [] };
    for (const w of this.k.plan.walls) {
      const q = w.room; if (!q || q.secret || y < q.y - 0.6 || y > q.y + q.h - 0.6) continue;
      const gaps = (w.openings || []).filter(o => !o.door.hidden && !o.door.vent && q.y + o.y < y + 1.2 && q.y + o.y + o.h > y + 0.6).map(o => [o.lo - 0.15, o.hi + 0.15]);
      (w.horiz ? W.H : W.V).push({ at: w.fixed, lo: w.lo, hi: w.hi, gaps });
    }
    W.H.sort((a, b) => a.at - b.at); W.V.sort((a, b) => a.at - b.at); all.set(key, W); return W;
  },
  // Does the straight line a to b (a0, a1 across these walls; b0, b1 along them) pass every wall it crosses at a doorway?
  _cross(list, a0, a1, b0, b1) {
    const lo = Math.min(a0, a1), hi = Math.max(a0, a1); if (hi - lo < 1e-6) return true;
    let i = 0, j = list.length; while (i < j) { const m = (i + j) >> 1; if (list[m].at <= lo) i = m + 1; else j = m; }
    for (; i < list.length && list[i].at < hi; i++) {
      const w = list[i], u = b0 + (b1 - b0) * (w.at - a0) / (a1 - a0); if (u < w.lo || u > w.hi) continue;
      let open = false; for (const g of w.gaps) if (u > g[0] && u < g[1]) { open = true; break; }
      if (!open) return false;
    }
    return true;
  },
  // Every work that can be seen through one of a room's doorways, from either side: its own, those of the rooms through
  // its doorways, and any other on the level with a clear line (through however many doorways) from some part of it to
  // some part of one of these openings. Galleries stand in rows: a picture can be seen through three doorways and more.
  _seenFrom(r, doors) {
    if (r._sysSeen) return r._sysSeen;
    const W = this._wallsAt(r.y + 0.1), out = [], beside = new Set([r.id, ...doors.map(d => (d.a === r.id ? d.b : d.a))]);
    const U = [0, -0.92, 0.92, -0.46, 0.46], Vv = [0, -1, 1, -0.5, 0.5];
    for (const a of this.k.museum.arts) {
      if (Math.abs((a.fy || 0) - r.y) > 0.6) continue;
      if (beside.has(a.room)) { out.push([a, a.room === r.id ? -1 : 0]); continue; }
      const tx = Math.cos(a.rot || 0), tz = -Math.sin(a.rot || 0), hw = a.obj ? Math.max(a.w / 2, a.half || 0.3) : a.w / 2, ox = a.obj ? 0 : a.nx * 0.08, oz = a.obj ? 0 : a.nz * 0.08;
      let best = Infinity;
      for (const d of doors) {
        const x = d.along === 'x', mx = (d.x0 + d.x1) / 2, mz = (d.z0 + d.z1) / 2, dist = Math.hypot(a.x - mx, a.z - mz);
        if (dist > 60 || dist >= best) continue;
        if (!a.obj && (mx - a.x) * a.nx + (mz - a.z) * a.nz < 0.05) continue;                // it has its back to this doorway
        const half = (x ? d.z1 - d.z0 : d.x1 - d.x0) / 2 - 0.06;
        let ok = false;
        for (let m = 0; m < 5 && !ok; m++) { const px = a.x + tx * hw * U[m] + ox, pz = a.z + tz * hw * U[m] + oz; for (let n = 0; n < 5 && !ok; n++) { const qx = x ? mx : mx + half * Vv[n], qz = x ? mz + half * Vv[n] : mz; ok = this._cross(W.H, pz, qz, px, qx) && this._cross(W.V, px, qx, pz, qz); } }
        if (ok) best = dist;
      }
      if (best < Infinity) out.push([a, best]);
    }
    out.sort((p, q) => p[1] - q[1]);
    return (r._sysSeen = out.map(p => p[0]));
  },

  // ---------------------------------------------------------------- the robots
  _guards() { return this._gf || (this._gf = features.find(f => f.id === 'guards')); },
  _free(b) {
    const s = b.sys; if (!s) return;
    if (s.kind === 'donuts') { b.g = s.g0; if (b.fy !== s.fy0) b.fy = s.fy0; }
    b.sys = null; if (b.head) b.head.rotation.x = 0;
  },
  // The control room a robot is sent to, and the floor it can drive there: the room, and the corridor outside its door.
  _ctrl() {
    if (this._ctrlMade !== undefined) return this._ctrlMade;
    const P = this.k.plan, rooms = P.rooms.filter(r => /^Security control room/i.test(r.gallery || ''));
    const p = this.k.pos, r = rooms.sort((a, b) => Math.hypot((a.x0 + a.x1) / 2 - p.x, (a.z0 + a.z1) / 2 - p.z) - Math.hypot((b.x0 + b.x1) / 2 - p.x, (b.z0 + b.z1) / 2 - p.z))[0];
    if (!r) return (this._ctrlMade = null);
    const doors = P.doorsOf(r.id).filter(d => !d.out && !d.vent && !d.hidden && d.h >= 1.3), d = doors[0]; if (!d) return (this._ctrlMade = null);
    const hallId = d.a === r.id ? d.b : d.a, hall = P.byId[hallId]; if (!hall) return (this._ctrlMade = null);
    const g = grid(P, [r.id, hallId], r.y), cxy = (c) => ({ x: g.X0 + ((c % g.nx) + 0.5) * g.C, z: g.Z0 + (Math.floor(c / g.nx) + 0.5) * g.C });
    const mx = (d.x0 + d.x1) / 2, mz = (d.z0 + d.z1) / 2, longZ = hall.z1 - hall.z0 > hall.x1 - hall.x0;
    // It turns up some way down the corridor, and comes in by the door.
    let far = -1; for (const s of [9, -9, 6, -6]) { far = nearestOpen(g, longZ ? (hall.x0 + hall.x1) / 2 : clamp(mx + s, hall.x0 + 0.6, hall.x1 - 0.6), longZ ? clamp(mz + s, hall.z0 + 0.6, hall.z1 - 0.6) : (hall.z0 + hall.z1) / 2, ROOM, 1.5); if (far >= 0) break; }
    // Where it stands to look about: the middle of the room, or towards either end of it (whichever is not where the toy is).
    const lx = r.x1 - r.x0 > r.z1 - r.z0, spots = [0, -0.3, 0.3].map(u => nearestOpen(g, (r.x0 + r.x1) / 2 + (lx ? u * (r.x1 - r.x0) : 0), (r.z0 + r.z1) / 2 + (lx ? 0 : u * (r.z1 - r.z0)), ROOM + 0.2, 3)).filter(c => c >= 0).map(cxy);
    if (far < 0 || !spots.length) return (this._ctrlMade = null);
    return (this._ctrlMade = { room: r, g, y: r.y, x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2, far: cxy(far), spot: spots[0], spots });
  },
  // A dry place on a robot's own floor to wait out the rain: the nearest room of its patch that is not wet.
  _refuge(b, gf) {
    const P = this.k.plan, list = [];
    for (const id of b.P.area) { const r = P.byId[id]; if (!r || this.wet.has(id)) continue; const c = nearestOpen(b.g, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, ROOM + 0.1, 4); if (c < 0) continue; const x = b.g.X0 + ((c % b.g.nx) + 0.5) * b.g.C, z = b.g.Z0 + (Math.floor(c / b.g.nx) + 0.5) * b.g.C; if (x < r.x0 || x > r.x1 || z < r.z0 || z > r.z1) continue; list.push({ x, z, d: Math.hypot(x - b.x, z - b.z) }); }
    list.sort((p, q) => p.d - q.d);
    for (const q of list.slice(0, 4)) { gf._plan(b, q.x, q.z); if (b.pn) return true; }
    return false;
  },
  _dryFor(b) { for (const id of b.P.rooms) { const w = this.wet.get(id); if (w && (w.on || w.wet > SLICK)) return false; } return true; },
  // The one hook in src/guards.js: called for each robot, just before it acts on what it has in mind. True: the building
  // has driven it this time (rained on, frozen by a fire test, listening to the PA, gone for donuts).
  guard(b, dt, gf) {
    const s = b.sys;
    if (!this.live && !s) return false;
    if (s && s.kind === 'donuts' && s.px !== undefined) { if (Math.hypot(b.x - s.px, b.z - s.pz) > 3) this._free(b); else { s.px = b.x; s.pz = b.z; } }      // put back on its beat by its own code (it caught the toy there): it is home
    if (b.mode === 'hold' || (gf.seq && gf.seq.b === b)) return false;       // it has the toy: let it finish
    try { return this._guard(b, dt, gf); } catch (e) { console.error('systems: robot', e); this._free(b); this.guard = () => false; return false; }
  },
  _guard(b, dt, gf) {
    const t = this.t, k = this.k, beat = b.mode === 'patrol' || b.mode === 'scan' || b.mode === 'return' || b.mode === 'search';
    let s = b.sys;
    const still = () => { b.v = 0; b.sus = 0; b.heard = null; b.seen = false; if (!beat) gf._return(b); };
    // ---- a fire test in the room it is in: it stops where it is, and restarts when the test is over
    const ft = this._testAt(b.x, b.z, b.fy);
    if (ft && !(s && s.kind === 'frozen')) {
      if (s && s.kind === 'donuts') this._free(b);
      if (!beat) gf.sfx.giveUp();
      s = b.sys = { kind: 'frozen', ft, until: Infinity }; this.busy.add(b);
      if (b.near) k.callout('SUPPRESSION TEST: UNIT HALTED');
    }
    if (s && s.kind === 'frozen') {
      if (s.until === Infinity && s.ft.stage !== 'run') s.until = t + REBOOT;
      if (t < s.until) { still(); return true; }
      this._free(b); if (b.near) gf.sfx.query(); return false;
    }
    // ---- the public address: it stops and listens
    if (s && s.kind === 'pa') { if (t < s.until && beat) { b.v = 0; b.sus = 0; return true; } this._free(b); s = null; }
    // ---- sent for donuts
    if (s && s.kind === 'donuts') return this._donuts(b, dt, gf, s, beat);
    // ---- rain
    const rain = this.rainAt(b.x, b.z, b.fy);
    if (rain && (!s || s.kind !== 'rain' || s.stage === 'shelter' || (!beat && t > s.blind))) {
      // Rained on: whatever it was doing, it breaks off and makes for a dry room on its patch.
      if (!beat) { gf.sfx.giveUp(); if (b.mode === 'chase' && b.chaseT > 2.5 && gf._evaded) gf._evaded(k); }
      b.mode = 'patrol'; b.mt = 0; b.sus = 0; b.heard = null;
      s = b.sys = { kind: 'rain', stage: this._refuge(b, gf) ? 'flee' : 'stuck', blind: t + 4 }; this.busy.add(b);
      if (b.near && Math.hypot(k.pos.x - b.x, k.pos.z - b.z) < 30) { k.callout('MOISTURE DETECTED'); gf.sfx.query(); }
      return true;
    }
    if (!s && beat && b.mode === 'patrol' && this.wet.size) {
      // Dry itself, but the next place on its beat is wet: it waits where it is.
      const P = b.P; if (this.wetAt(P.pts[b.k * 2], P.pts[b.k * 2 + 1], b.fy) > SLICK) { s = b.sys = { kind: 'rain', stage: 'shelter', blind: 0 }; this.busy.add(b); }
    }
    if (!(s && s.kind === 'rain')) return false;
    if (t < s.blind) { b.sus = 0; b.heard = null; if (!beat) { b.mode = 'patrol'; b.mt = 0; } }
    else if (!beat) return false;                                    // it has seen the toy from where it shelters: that is its own business
    if (s.stage === 'flee') {
      if (gf._follow(b, BOT.look * 1.5, dt)) { s.stage = 'shelter'; b.v = 0; }
      b.look = turn(b.look, b.yaw, 4 * dt);
    } else {
      b.v = 0; b.look = turn(b.look, b.yaw + Math.sin(t * 1.1 + b.i) * 1.3, 2.5 * dt);
      if (s.stage === 'stuck' && !rain && this._refuge(b, gf)) s.stage = 'flee';
      else if (this._dryFor(b) && !this.wetAt(b.x, b.z, b.fy)) { this._free(b); gf._return(b); return false; }
      else if (s.stage === 'shelter' && this.wetAt(b.x, b.z, b.fy) > SLICK && !rain && (s.again || 0) < t) { s.again = t + 5; if (this._refuge(b, gf)) s.stage = 'flee'; }
    }
    return true;
  },
  _donuts(b, dt, gf, s, beat) {
    const t = this.t, k = this.k, c = s.c;
    if (s.stage === 'called') {
      // It finishes what it is doing, then goes: when nobody is near enough to watch it leave its patch.
      b.v = 0; b.sus = 0; b.heard = null; b.look = turn(b.look, b.yaw + Math.PI, 3 * dt);
      if (!s.said && b.near) { s.said = true; k.callout('OFF DUTY: DONUTS'); }
      if (!b.near || t - s.t > 5) { s.stage = 'travel'; s.t = t; s.wait = clamp((Math.hypot(b.x - c.x, b.z - c.z) + Math.abs(b.fy - c.y) * 5) / 9, 7, 20); b.fy = PARK; }
      return true;
    }
    if (s.stage === 'travel') {
      if (t - s.t > s.wait) { const toy = k.pos, clear = q => Math.hypot(q.x - toy.x, q.z - toy.z); c.spot = c.spots.find(q => clear(q) > 2) || c.spots.reduce((m, q) => (clear(q) > clear(m) ? q : m)); b.g = c.g; b.fy = c.y; b.x = c.far.x; b.z = c.far.z; b.mode = 'patrol'; b.mt = 0; b.v = 0; b.sus = 0; gf._plan(b, c.spot.x, c.spot.z); b.yaw = b.look = b.pn > 1 ? Math.atan2(b.path[2] - b.x, b.path[3] - b.z) : 0; s.stage = b.pn ? 'come' : 'back'; s.t = t; s.px = b.x; s.pz = b.z; this.event('A patrol unit has arrived at the control room.', false); }
      return true;
    }
    if (s.stage === 'home') {
      if (t - s.t > s.wait) { b.g = s.g0; b.fy = s.fy0; b.sys = null; gf._home(b, 0); }
      return true;
    }
    // In the control room. If it was put back on its beat meanwhile (a chase given up with no way home), it is home already.
    if (cellAt(c.g, b.x, b.z) < 0 || b.g !== c.g) { this._free(b); return false; }
    // Off duty. It takes no notice of the toy at all, whatever it has just seen or heard: nothing builds up, and it is never after you.
    b.sus = 0; b.heard = null; b.seen = false; b.cool = 1;
    if (b.mode !== 'patrol') { b.mode = 'patrol'; b.mt = 0; if (s.stage === 'come') gf._plan(b, c.spot.x, c.spot.z); else if (s.stage === 'back') gf._plan(b, c.far.x, c.far.z); }
    if (this.rainAt(b.x, b.z, b.fy) && s.stage !== 'back') { s.stage = 'back'; gf._plan(b, c.far.x, c.far.z); if (b.near) k.callout('MOISTURE DETECTED'); }
    if (s.stage === 'come') { if (!b.pn || gf._follow(b, BOT.look, dt)) { s.stage = 'sniff'; s.t = t; b.v = 0; } b.look = turn(b.look, b.yaw, 4 * dt); }
    else if (s.stage === 'sniff') {
      b.v = 0; b.look = turn(b.look, b.yaw + Math.sin((t - s.t) * 1.4) * 1.5, 3 * dt);
      if (t - s.t > 2 && !s.asked) { s.asked = true; if (b.near) k.callout('OFF DUTY. DONUTS?'); gf.sfx.query(); }
      if (t - s.t > 9) { s.stage = 'back'; gf._plan(b, c.far.x, c.far.z); if (b.near) { k.callout('NO DONUTS. BACK ON DUTY SOON'); gf.sfx.giveUp(); } }
    } else {
      if (!b.pn || gf._follow(b, BOT.walk * 1.3, dt)) { s.stage = 'home'; s.t = t; s.wait = 8; b.fy = PARK; b.v = 0; s.px = undefined; }
      b.look = turn(b.look, b.yaw, 4 * dt);
    }
    return true;
  },

  // ---------------------------------------------------------------- the proof
  // Render from each view with everything this file draws hidden, and again with it shown, and compare every pixel a
  // work of art shows in. Which pixels those are is found two ways: by the frame's alpha (exactly 0 on a work shown
  // true: src/finish.js keepTrue), and by painting every work a flat colour, then another, and taking the pixels that
  // change (so a work seen through the glass of its case is counted too, apart). Floating point, no MSAA.
  // views: [{ name, at: [x, y, z], look: [x, y, z], fov }]. Stand the game's camera there first (G.testEye): the mist
  // and vapour keep under its eye.
  artCheck(views, W = 640) {
    const G = this.k.G, r = G.renderer, H = Math.round(W * 9 / 16), rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType });
    const cam = new THREE.PerspectiveCamera(60, W / H, 0.05, 400), N = W * H * 4, a = new Float32Array(N), b = new Float32Array(N), m1 = new Float32Array(N), m2 = new Float32Array(N), rows = [];
    const prev = r.getRenderTarget(), was = this.root.visible, arts = G.museum.arts;
    const flat = new THREE.MeshBasicMaterial({ color: 0xff00ff, fog: false, toneMapped: false }), cut = new Map();
    const marker = q => { if (!q.obj) return flat; let m = cut.get(q); if (!m) { m = new THREE.MeshBasicMaterial({ color: 0xff00ff, fog: false, toneMapped: false, map: q.mat.map, alphaTest: 0.5, side: THREE.DoubleSide }); cut.set(q, m); } return m; };
    const shot = out => { r.setRenderTarget(rt); r.clear(); r.render(G.scene, cam); r.readRenderTargetPixels(rt, 0, 0, W, H, out); };
    for (const v of views) {
      cam.fov = v.fov || 60; cam.position.fromArray(v.at); cam.up.set(0, 1, 0); cam.lookAt(v.look[0], v.look[1], v.look[2]); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      this.root.visible = false; shot(a);
      const own = arts.map(q => q.mesh.material);      // (not always q.mat: a work that comes alive wears a guard, src/paintlife.js)
      for (const q of arts) q.mesh.material = marker(q);
      flat.color.set(0xff00ff); for (const m of cut.values()) m.color.set(0xff00ff); shot(m1);
      flat.color.set(0x00ff00); for (const m of cut.values()) m.color.set(0x00ff00); shot(m2);
      arts.forEach((q, i) => { q.mesh.material = own[i]; });
      this.root.visible = true; shot(b);
      // true: a work shown exactly (alpha 0). veiled: a work seen through something of the game's own that already adds
      // light over it and takes it out of "shown exactly" (the glass of a case, a lamp's pool at a glancing angle).
      let trueN = 0, trueChanged = 0, veiled = 0, veiledChanged = 0, other = 0, worst = 0;
      for (let i = 0; i < N; i += 4) {
        const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]));
        const exact = a[i + 3] === 0, geo = Math.abs(m1[i] - m2[i]) + Math.abs(m1[i + 1] - m2[i + 1]) + Math.abs(m1[i + 2] - m2[i + 2]) > 0.02;
        if (exact) { trueN++; if (d > 0 || b[i + 3] !== 0) trueChanged++; }
        else if (geo) { veiled++; if (d > 1e-5) { veiledChanged++; worst = Math.max(worst, d / Math.max(1e-3, Math.max(a[i], a[i + 1], a[i + 2]))); if (v.debug) { const px = (i / 4) % W, py = Math.floor(i / 4 / W); (v.debug.px || (v.debug.px = [])).push([px, py, +(b[i] - a[i]).toFixed(3), +(b[i + 1] - a[i + 1]).toFixed(3), +(b[i + 2] - a[i + 2]).toFixed(3), +a[i + 3].toFixed(3)]); } } }
        else if (d > 1e-3) other++;
      }
      rows.push({ view: v.name || '', truePx: trueN, trueChanged, veiledPx: veiled, veiledChanged, worstVeiled: +worst.toFixed(4), effectPx: other, debug: v.debug ? v.debug.px : undefined });
    }
    this.root.visible = was; r.setRenderTarget(prev); rt.dispose(); flat.dispose(); for (const m of cut.values()) m.dispose();
    const sum = key => rows.reduce((n, q) => n + q[key], 0);
    return { pass: sum('trueChanged') === 0, views: rows.length, truePx: sum('truePx'), trueChanged: sum('trueChanged'), veiledPx: sum('veiledPx'), veiledChanged: sum('veiledChanged'), effectPx: sum('effectPx'), rows };
  },

  spots() { return this.zoneMarks.map(z => ({ kind: 'thing', id: 'sys-' + z.id, name: 'Sprinkler zone ' + z.id, x: z.at.x, y: z.at.y, z: z.at.z, ...(z.at.shut ? { unseen: true } : null) })); },      // (unseen: in a shut room: kept for the distances, never drawn on a map)

  // A new night: every valve shut, every floor dry, every curtain open, every robot its own again.
  reset(k) {
    for (const w of this.wet.values()) { if (w.puddle) { const i = k.plan.puddles.indexOf(w.puddle); if (i >= 0) k.plan.puddles.splice(i, 1); } if (w.fx) this._dispose(w.fx); }
    this.wet.clear();
    for (const ft of this.tests.values()) { this._endTest(ft, 'reset'); if (ft.fx) this._dispose(ft.fx); }
    this.tests.clear(); this.rested.clear(); this.calls = [];
    const gf = this._guards(); for (const b of (gf && gf.bots) || []) if (b.sys) this._free(b);
    this.busy.clear(); this.pa = { until: 0, text: '' };
    if (this.spray) { this.spray.life.fill(0); this.spray.mesh.visible = false; } this.sprayLive = 0;
    this._hiss(0, true); this.live = false; this.level.visible = false;
  },
});
export default S;
