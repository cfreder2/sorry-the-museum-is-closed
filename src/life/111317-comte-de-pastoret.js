// Jean Auguste Dominique Ingres, Amédée-David, the Comte de Pastoret (1823–26), Gallery 220. The word: likeness.
//
// A young man of thirty-two stands in the embroidered black coat of his office, one hand on his hip above a gilt
// sword hilt, the thumb of the other tucked into his coat, the cross of an order at his throat on a red ribbon; his
// hat and gloves are put by on a chair; he looks straight out. The museum's note says he "stands outlined against
// forest-green silk wallpaper and a swag of matching drapery", that the medal and the "exquisitely detailed golden
// sword hilt alleviate the somber darkness of his costume", and that he "stares directly at the viewer" with
// confidence and "a less-than-subtle air of disinterest". It says two more things. He commissioned the picture, one
// of several, from Ingres, who was his friend; and it stayed with him and his family until 1890. So this was his own
// likeness, made at his asking, and he lived in front of it. That is what only this picture in the room has: a
// sitter who was also the one who came to look.
//
// So he comes out, and what he does in the room is what anyone does here at night: he looks at the picture. Look,
// and the swag of green silk at the picture's right edge is let down past the frame to the floor, as if the painted
// one hung on into the room. It is put aside from behind, and he steps out past it and walks towards you, a hand on
// his hip over the hilt (as a man walks who wears a sword), the other arm swinging: for a moment you have him from
// the front, as the picture has him. He stops, turns about, tucks his thumb into his coat, and looks up at himself,
// his back to you and the green silk behind him, his head a little on one side. He is quite still. Then his head
// comes round over his shoulder, past the elbow, and he looks straight at you: the picture's own look, twice now,
// one above the other, on a low note that a second note joins. A small nod. And he goes back to the picture, which
// interests him more. While you keep looking he stands there, shifts his weight, considers, and now and then looks
// round at you again. When you stop he turns, walks back in past the silk, and the silk is drawn up under the frame.
//
// He does not walk in and take the pose (Lawrence's sitter across this room does that, and Modigliani's two): the
// hand on the hip and the thumb in the coat are only how he carries himself, and the look over the shoulder is the
// portrait's own turn of the head, met from the other side.
//
// How he is made. Ingres hid his brush: the quality of the picture is a contour as exact as a cut and tone that
// turns without a seam, so here nothing is loose and nothing is stroked. He is measured (seven and three quarter
// heads, the high waist and sloping shoulders of the coat, the sleeve heads a little full, limbs that taper, hands
// with fingers), every form is a smooth surface laid by a rule, and no surface takes the room's light: his light,
// from the upper left as in the picture, is worked out in the paint. The black is his black: nearly nothing in the
// shadow, a grey bloom where the cloth turns to the light and along its edge, and the embroidery (leaves and stems
// of black silk on black cloth, down the breast, round the waist, the collar and the cuffs) found only where the
// light catches it. The flesh is pale and close in tone, turning to a warmer shade at its edge. The face is painted
// as he painted it, in one piece and exactly: the broad forehead, straight heavy brows low over hooded grey eyes that
// look at you, the long nose with its shade on the far side, a small closed mouth, colour in the cheeks, the
// red-brown whiskers, and the chestnut curls standing wide of the temples, which are modelled. The cross (white
// enamel, a gold crown, its red ribbon), the white of collar and cuffs, and the hilt (gilt, with a pearl grip) are
// the few lights in the dark, as the museum says they are. The sword stays in its scabbard at his hip the whole
// time: it is never drawn, lifted or pointed, and nothing is done with it.
//
// The silk is one sheet with its folds and its hard crumpled lights (taffeta), in the picture's greens. One rig
// (him), the silk, and the soft shadows on the floor: three draw calls. He stands 0.74 m. Everything is under the
// rail of this frame: he comes no further than 0.95 m out from this wall and keeps within 0.6 m of the middle of
// his picture; the silk hangs under the frame's right-hand corner, 0.12 m deep. Turner's sea
// (src/life/4796-fishing-boats-hucksters.js) begins 1.74 m out from this wall, so the two never meet; Constable's lane
// (4758) is across the room on the same wall as the sea, and Lawrence's Isabella Wolff (4773) walks in and sits on
// the wall opposite, seven metres away: her show is her gown and its light, this one has no light that runs and no
// chair. He is soft to the toy: it is eased round him, never stopped and never through him; nothing is pushed and
// nothing stays out after the look.
//
// No tune: steps on the boards, the silk, and two plain notes (G, and the B that makes it a chord) for the two
// looks. With "Reduce motion and flashing" on, the silk comes down slowly and does not swing, he turns more slowly,
// the gilt keeps one steady light, and it is all quieter; nothing here flashes at any setting.
//
// What it does not do: it gives him no story but the museum's (he commissioned it from his friend, and it stayed in
// his family), nothing is made of his office, his order, his title or his politics, his mother's picture two rooms
// away is not answered and no family is built between them, the hat, the gloves and the chair Ingres signed stay in
// the picture, his legs and the back of him are ours (the picture stops at the thigh) and are plain black so as to
// claim nothing, and his look at you is the museum's "direct" one, with a nod, not a sneer: he was a real man, and
// this is his face.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, canvasTexture } from '../paintlife.js';
import { score, hump, turnTo } from './stagecraft.js';

const PI = Math.PI, TAU = PI * 2;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sstep = (x, a, b) => { const q = clamp01((x - a) / (b - a)); return q * q * (3 - 2 * q); };
const gss = (x, w) => Math.exp(-(x / w) * (x / w));

// ---------------------------------------------------------------- how big, and where (metres in the room: u along
// the wall to the viewer's right from the middle of the picture, out from the wall)
const S = 0.44;                                          // he is set out at a man's size (1.78 m) and shown at this: 0.78 m
const HOME = [0.3, -0.36], P_END = [0.03, 0.57];          // in the wall behind the silk; where he stands to look
const WAY = [HOME, [0.29, 0.0], [0.2, 0.3], P_END];
const SILK = { u0: 0.15, u1: 0.57, deep: 0.05 };         // the silk: under the right-hand corner of the frame
// ---------------------------------------------------------------- the show, in seconds
const T_DROP = [0.15, 1.0];                              // the silk is let down
const T_WALK = [0.95, 2.9];                              // he comes out past it and towards you
const T_TURN = [3.1, 4.05];                              // turns about
const T_UP = [3.55, 4.35];                               // looks up at the picture
const T_HAND = [3.3, 4.1];                               // his thumb to his coat
const T_TILT = [4.45, 5.1];                              // his head a little on one side
const G0 = 5.25, G1 = 8.25;                              // looks round at you; goes back to the picture
const T_LOOP = 9.6, PER = 9.5, LG0 = 4.6, LG1 = 6.7;     // and on: now and then he looks round again
const RET = 2.8;
// ---------------------------------------------------------------- his measures (a man's, in metres)
const HIP = 0.9, WAIST = 1.08, NECK = [0, 1.535, -0.015], SHO = [0.19, 1.44, -0.005], HIPW = 0.086;
const THIGH = 0.42, SHIN = 0.42, ANKLE = 0.06, AU = 0.3, AF = 0.255;
const HC = [0, 1.662, 0];                                // the middle of his head

// ---------------------------------------------------------------- surfaces: every form is a smooth sheet laid by a rule
const K = { CLOTH: 0, FLESH: 1, FACE: 2, HAIR: 3, LINEN: 4, GOLD: 5, RED: 6, CARD: 7, PEARL: 8, SHOE: 9 };
const part = () => ({ pos: [], nor: [], col: [], uv: [], k: [] });
const _e1 = V3(), _e2 = V3(), _e3 = V3();
// na by nb squares; f(a, b, out) its rule. o: kind, extra (one number the shader gets), col (a colour), uv(a, b, p),
// wrap (it closes on itself round a).
function surf(P, na, nb, f, o = {}) {
  const { kind = 0, extra = 0, col = null, uv = null, wrap = false } = o, W = na + 1, pts = [], nrm = [], cen = V3();
  for (let j = 0; j <= nb; j++) for (let i = 0; i <= na; i++) { const p = f(i / na, j / nb, V3()); pts.push(p); cen.add(p); }
  cen.multiplyScalar(1 / pts.length);
  let vote = 0;
  for (let j = 0; j <= nb; j++) for (let i = 0; i <= na; i++) {
    let i0 = i - 1, i1 = i + 1; if (wrap) { if (i0 < 0) i0 = na - 1; if (i1 > na) i1 = 1; } else { i0 = Math.max(0, i0); i1 = Math.min(na, i1); }
    let n = null;
    for (const jj of [j, j === 0 ? 1 : j === nb ? nb - 1 : j]) {      // (at a pole the turn is taken from the ring next to it)
      const j0 = Math.max(0, jj - 1), j1 = Math.min(nb, jj + 1);
      _e1.copy(pts[jj * W + i1]).sub(pts[jj * W + i0]); _e2.copy(pts[j1 * W + i]).sub(pts[j0 * W + i]); _e3.crossVectors(_e1, _e2);
      if (_e3.lengthSq() > 1e-18) { n = _e3.clone().normalize(); break; }
    }
    if (!n) n = V3(0, 1, 0);
    vote += n.dot(_e1.copy(pts[j * W + i]).sub(cen)); nrm.push(n);
  }
  if (vote < 0) for (const n of nrm) n.negate();
  const c = col || WHITE, put = (i, j) => {
    const k = j * W + i, p = pts[k], n = nrm[k], t = uv ? uv(i / na, j / nb, p) : NOUV, e = typeof extra === 'function' ? extra(i / na, j / nb, p) : extra;
    P.pos.push(p.x, p.y, p.z); P.nor.push(n.x, n.y, n.z); P.col.push(c.r, c.g, c.b); P.uv.push(t[0], t[1]); P.k.push(kind, e);
  };
  for (let j = 0; j < nb; j++) for (let i = 0; i < na; i++) {
    const A = pts[j * W + i], B = pts[j * W + i + 1], C = pts[(j + 1) * W + i + 1], D = pts[(j + 1) * W + i];
    _e1.copy(B).sub(A); _e2.copy(D).sub(A); _e3.crossVectors(_e1, _e2); if (_e3.lengthSq() < 1e-20) { _e1.copy(C).sub(B); _e2.copy(D).sub(B); _e3.crossVectors(_e1, _e2); }
    if (_e3.dot(nrm[j * W + i]) >= 0) { put(i, j); put(i + 1, j); put(i + 1, j + 1); put(i, j); put(i + 1, j + 1); put(i, j + 1); }
    else { put(i, j); put(i + 1, j + 1); put(i + 1, j); put(i, j); put(i, j + 1); put(i + 1, j + 1); }
  }
}
const WHITE = new THREE.Color(1, 1, 1), NOUV = [-1, -1];
// A limb: round a path(t, out), rad(t, ph) its radius; ref is where ph = 0 points.
const _c = V3(), _c2 = V3(), _T = V3(), _A = V3(), _B = V3();
function tube(P, path, rad, na, nb, o = {}) {
  const ref = o.ref || V3(0, 0, 1);
  surf(P, na, nb, (a, b, out) => {
    path(b, _c); path(Math.min(1, b + 0.01), _c2); _T.copy(_c2); path(Math.max(0, b - 0.01), _c2); _T.sub(_c2).normalize();
    _A.copy(ref).addScaledVector(_T, -ref.dot(_T)); if (_A.lengthSq() < 1e-6) _A.set(1, 0, 0).addScaledVector(_T, -_T.x); _A.normalize(); _B.crossVectors(_T, _A);
    const ph = a * TAU, r = rad(b, ph);
    return out.copy(_c).addScaledVector(_A, r * Math.cos(ph)).addScaledVector(_B, r * Math.sin(ph));
  }, { wrap: true, ...o });
}
const line = (p, q) => (t, out) => out.set(lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerp(p[2], q[2], t));
const curve = pts => { const c = new THREE.CatmullRomCurve3(pts.map(p => V3(...p)), false, 'centripetal'); return (t, out) => c.getPoint(clamp01(t), out); };
// rounded at its ends: e0, e1 how much of its length each end takes
const capped = (r, e0 = 0.06, e1 = 0.06) => (t, ph) => (typeof r === 'function' ? r(t, ph) : r) * (t < e0 ? Math.sqrt(Math.max(0, 1 - (1 - t / e0) * (1 - t / e0))) : t > 1 - e1 ? Math.sqrt(Math.max(0, 1 - Math.pow(1 - (1 - t) / e1, 2))) : 1);
const prof = pts => t => { for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const a = pts[i - 1], c = pts[i]; return lerp(a[1], c[1], sstep(t, a[0], c[0])); } return pts[pts.length - 1][1]; };
function ball(P, c, r, o = {}, na = 14, nb = 9) {
  const m = o.m || null;
  surf(P, na, nb, (a, b, out) => { const th = a * TAU, ph = (b - 0.5) * PI, cp = Math.cos(ph); out.set(r[0] * Math.sin(th) * cp, r[1] * Math.sin(ph), r[2] * Math.cos(th) * cp); if (m) out.applyMatrix4(m); return out.set(out.x + c[0], out.y + c[1], out.z + c[2]); }, { wrap: true, ...o });
}
// A body: rings [y, zc, rx, rf (front), rb (back), n (how square)], eased through; th = 0 is its front, +x his left.
const cr = (p0, p1, p2, p3, t) => 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
function row(rows, x) { const n = rows.length, f = Math.min(n - 1 - 1e-6, Math.max(0, x * (n - 1))), i = Math.floor(f), t = f - i, a = rows[Math.max(0, i - 1)], b = rows[i], c = rows[i + 1], d = rows[Math.min(n - 1, i + 2)]; return b.map((_, k) => cr(a[k], b[k], c[k], d[k], t)); }
function ringPt(R, th, out, grow = 1) {
  const e = 2 / R[5]; let cs = Math.cos(th), sn = Math.sin(th); cs = Math.sign(cs) * Math.pow(Math.abs(cs), e); sn = Math.sign(sn) * Math.pow(Math.abs(sn), e);
  return out.set(R[2] * sn * grow, R[0], R[1] + (cs > 0 ? R[3] : R[4]) * cs * grow);
}
const TORSO = [[1.0, 0, 0.15, 0.112, 0.106, 2.3], [1.045, 0, 0.152, 0.116, 0.106, 2.3], [1.09, 0, 0.141, 0.109, 0.1, 2.3], [1.17, 0.005, 0.153, 0.121, 0.105, 2.4], [1.27, 0.012, 0.177, 0.14, 0.112, 2.5], [1.36, 0.012, 0.196, 0.142, 0.12, 2.6], [1.43, 0.004, 0.186, 0.122, 0.122, 2.2], [1.475, -0.004, 0.158, 0.1, 0.112, 2.1], [1.51, -0.008, 0.108, 0.082, 0.098, 2.1], [1.54, -0.012, 0.07, 0.07, 0.08, 2.0]];
const PELVIS = [[0.79, 0, 0.02, 0.02, 0.02, 2], [0.81, 0, 0.12, 0.09, 0.095, 2.2], [0.87, 0, 0.166, 0.106, 0.116, 2.4], [0.95, 0, 0.172, 0.112, 0.125, 2.4], [1.03, 0, 0.158, 0.11, 0.112, 2.3], [1.1, 0, 0.14, 0.104, 0.098, 2.3]];
const T_Y0 = 1.0, T_Y1 = 1.54;

// ---------------------------------------------------------------- his head: an ellipsoid with the face drawn forward
// on it (th round it, 0 his front; Y up it, -1 the chin, 1 the crown)
function headAt(th, ph, out, grow = 0) {
  const cp = Math.cos(ph), Y = Math.sin(ph), ct = Math.cos(th), st = Math.sin(th), F = Math.max(0, ct), ath = Math.abs(Math.atan2(st, ct));
  const low = sstep(-Y, 0.2, 0.95);
  const cj = Y < 0 ? Math.pow(cp, 0.42) : cp, cf = Y < 0 ? Math.pow(cp, 0.6) : cp;      // (a jaw, broad and full: not an egg)
  const x = 0.083 * st * cj * (1 - 0.07 * low), y = 0.118 * Y; let z = (ct > 0 ? 0.094 : 0.104) * ct * cf;
  let f = 0.012 * F * F * gss(Y + 0.83, 0.17) - 0.018 * F * sstep(-Y, 0.9, 1.0);                               // the chin, and the jaw falling back under it
  const nb = Y > -0.33 ? sstep(-Y, -0.22, 0.33) : sstep(Y, -0.45, -0.33);
  f += 0.03 * Math.pow(nb, 1.4) * gss(th, 0.1 + 0.07 * sstep(-Y, 0, 0.33)) + 0.006 * gss(ath - 0.2, 0.075) * gss(Y + 0.35, 0.05);      // the nose, long and straight; its wings
  f += 0.005 * F * gss(Y - 0.2, 0.07) * (1 - 0.5 * gss(th, 0.12));                                              // the brow
  f += -0.0075 * gss(ath - 0.42, 0.2) * gss(Y - 0.075, 0.07) + 0.0035 * gss(ath - 0.42, 0.14) * gss(Y - 0.07, 0.035);      // the eyes set in under it
  f += 0.004 * F * gss(ath - 0.8, 0.3) * gss(Y + 0.12, 0.2);                                                    // the cheekbones
  f += 0.007 * gss(th, 0.36) * gss(Y + 0.6, 0.13) + 0.003 * gss(th, 0.26) * gss(Y + 0.55, 0.035) + 0.0035 * gss(th, 0.2) * gss(Y + 0.675, 0.04) - 0.003 * gss(th, 0.3) * gss(Y + 0.612, 0.016) - 0.003 * gss(th, 0.3) * gss(Y + 0.76, 0.035);      // the mouth
  z += f;
  out.set(HC[0] + x, HC[1] + y, HC[2] + z);
  if (grow) { const l = Math.hypot(x, y, z) || 1; out.x += x / l * grow; out.y += y / l * grow; out.z += z / l * grow; }
  return out;
}
// where his hair begins (Y), round his head: high over the brow, down before the ears, to the nape behind
const hairline = ath => ath < 0.85 ? lerp(0.56, 0.32, sstep(ath, 0.15, 0.85)) : ath < 1.6 ? lerp(0.32, -0.12, sstep(ath, 0.85, 1.3)) : lerp(-0.12, -0.62, sstep(ath, 1.6, 2.5));
// its curls: lumps on a deep mass that stands wide of the temples and high over the brow
const LUMPS = (() => { let s = 111317; const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646, out = []; for (let i = 0; i < 120; i++) { const th = (r() * 2 - 1) * PI, Y = lerp(-0.45, 0.98, r()); out.push([th, Math.asin(Y), 0.008 + 0.011 * r(), 0.09 + 0.07 * r()]); } return out; })();
function hairThick(th, ph) {
  const Y = Math.sin(ph), ath = Math.abs(th), F = Math.max(0, Math.cos(th));
  let t = 0.01 + 0.05 * gss(ath - 1.2, 0.5) * gss(Y - 0.3, 0.42) + 0.026 * sstep(Y, 0.4, 0.95) + 0.02 * F * gss(Y - 0.78, 0.25);
  for (const l of LUMPS) { let d = th - l[0]; d = Math.atan2(Math.sin(d), Math.cos(d)) * Math.cos(ph); const e = ph - l[1], q = (d * d + e * e) / (l[3] * l[3]); if (q < 6) t += l[2] * Math.exp(-q); }
  return t * (0.3 + 0.7 * sstep(Y - hairline(ath), -0.02, 0.2));
}
// the head's own picture (in the atlas): across it th, up it Y
const HEAD_H = 448, TOR_Y = 448, TOR_H = 384, TILE_Y = 832, AT = 1024;
const headUV = (th, Y) => [0.5 + th / TAU, 1 - (1 - (Y + 1) / 2) * HEAD_H / AT];
const torsoUV = (th, y) => [0.5 + th / TAU, 1 - (TOR_Y + (1 - (y - T_Y0) / (T_Y1 - T_Y0)) * TOR_H) / AT];
const bandUV = (a, b) => [(200 + a * 496) / AT, 1 - (TILE_Y + 184 - b * 176) / AT];

// A hand, from the wrist (the origin): fingers down -y, the palm to +x, the thumb to +z; m sets it somewhere.
function hand(P, m, col, { spread = 0.08, curl = 0.5 } = {}) {
  const o = { kind: K.FLESH, col }, put = f => (a, b, out) => f(a, b, out).applyMatrix4(m), pv = V3();
  surf(P, 12, 8, put((a, b, out) => { const th = a * TAU, ph = (b - 0.5) * PI, cp = Math.cos(ph); return out.set(0.004 + 0.0135 * Math.cos(th) * cp, -0.05 + 0.052 * Math.sin(ph), 0.04 * Math.sin(th) * cp); }), { ...o, wrap: true });
  const fz = [0.027, 0.009, -0.009, -0.026], fy = [-0.086, -0.092, -0.09, -0.082], fl = [0.072, 0.08, 0.074, 0.058], fr = [0.0092, 0.0095, 0.009, 0.008];
  for (let i = 0; i < 4; i++) {
    const path = (t, out) => out.set(0.004 + fl[i] * curl * 0.62 * t * t, fy[i] - fl[i] * (t - 0.16 * curl * t * t), fz[i] + (fz[i] / 0.027) * spread * fl[i] * t);
    surf(P, 7, 6, put((a, b, out) => { const t = b, ph = a * TAU; path(t, pv); const r = capped(q => lerp(fr[i], fr[i] * 0.74, q), 0.01, 0.16)(t, ph); return out.set(pv.x + r * Math.cos(ph), pv.y, pv.z + r * Math.sin(ph)); }), { ...o, wrap: true });
  }
  const tp = (t, out) => out.set(0.008 + 0.018 * t, -0.03 - 0.05 * t, 0.034 + 0.04 * t - 0.012 * t * t);
  surf(P, 7, 6, put((a, b, out) => { const ph = a * TAU; tp(b, pv); const r = capped(q => lerp(0.0112, 0.0085, q), 0.01, 0.18)(b, ph); return out.set(pv.x + r * Math.cos(ph), pv.y + 0.4 * r * Math.sin(ph), pv.z + r * Math.sin(ph)); }), { ...o, wrap: true });
}

// ---------------------------------------------------------------- the atlas: his face, the embroidery, the cross
function paintAtlas(rand) {
  return canvasTexture(AT, AT, g => {
    g.fillStyle = '#000'; g.fillRect(0, 0, AT, AT);
    const soft = (x, y, rx, ry, rgb, a, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(rx, ry); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(0.55, `rgba(${rgb},${a * 0.55})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore(); };
    // ------------------------------------------------ his head: th across (163 px to the radian), Y up
    const X = th => 512 + th / PI * 512, Yp = Y => (1 - (Y + 1) / 2) * HEAD_H, R = 512 / PI;
    g.save(); g.beginPath(); g.rect(0, 0, AT, HEAD_H); g.clip();
    g.fillStyle = '#e9c6aa'; g.fillRect(0, 0, AT, HEAD_H);
    { const gr = g.createLinearGradient(X(-1.3), 0, X(1.5), 0); gr.addColorStop(0, 'rgba(206,158,128,0.75)'); gr.addColorStop(0.3, 'rgba(244,216,190,0.6)'); gr.addColorStop(0.52, 'rgba(240,208,180,0.15)'); gr.addColorStop(0.78, 'rgba(190,138,108,0.55)'); gr.addColorStop(1, 'rgba(150,100,76,0.8)'); g.fillStyle = gr; g.fillRect(0, 0, AT, HEAD_H); }
    soft(X(-0.1), Yp(0.42), 120, 46, '250,228,206', 0.75);                                    // the forehead, in the light
    soft(X(-0.16), Yp(-0.86), 34, 20, '246,220,198', 0.5);                                    // the chin
    for (const sd of [-1, 1]) {
      soft(X(sd * 0.68), Yp(-0.2), 62, 48, '214,104,84', 0.5);                                // colour in the cheeks
      soft(X(sd * 0.42), Yp(0.13), 56, 22, '128,80,62', 0.6);                                 // the shade his eyes lie in
      soft(X(sd * 0.2), Yp(0.12), 20, 20, '128,80,62', 0.45);
      soft(X(sd * 0.13), Yp(-0.385), 8, 4.5, '82,40,34', 0.75);                               // a nostril
      soft(X(sd * 0.21), Yp(-0.35), 9, 10, '170,104,86', 0.35, sd * 0.3);
      soft(X(sd * 0.46), Yp(-0.6), 16, 12, '170,110,90', 0.3);                                // the corner of the mouth
    }
    soft(X(0.14), Yp(-0.1), 17, 64, '140,88,68', 0.62, -0.06);                                 // the shade down the far side of his nose
    soft(X(-0.045), Yp(-0.08), 7, 60, '252,232,212', 0.6);                                    // and the light down its ridge
    soft(X(-0.03), Yp(-0.31), 11, 9, '252,232,214', 0.6);
    soft(X(0.02), Yp(-0.43), 36, 10, '126,74,58', 0.55);                                      // under the nose
    soft(X(0), Yp(-0.76), 40, 10, '150,94,74', 0.45);                                         // under the lower lip
    { const gr = g.createLinearGradient(0, Yp(-0.86), 0, Yp(-1)); gr.addColorStop(0, 'rgba(130,84,64,0)'); gr.addColorStop(1, 'rgba(120,76,58,0.75)'); g.fillStyle = gr; g.fillRect(0, Yp(-0.86), AT, 40); }
    // his eyes: hooded, grey, level, and looking at you
    for (const sd of [-1, 1]) {
      const ex = X(sd * 0.42), ey = Yp(0.07), hw = 33, almond = () => { g.beginPath(); g.moveTo(ex - hw, ey + 2); g.quadraticCurveTo(ex - 2 * sd, ey - 17, ex + hw, ey + 1); g.quadraticCurveTo(ex, ey + 14, ex - hw, ey + 2); g.closePath(); };
      g.save(); almond(); g.clip();
      g.fillStyle = '#e6dcd2'; g.fillRect(ex - 40, ey - 20, 80, 40);
      g.fillStyle = '#3a302a'; g.beginPath(); g.arc(ex, ey - 2, 14, 0, TAU); g.fill();
      g.fillStyle = '#56483e'; g.beginPath(); g.arc(ex, ey - 2, 11.4, 0, TAU); g.fill();
      g.fillStyle = '#120d0b'; g.beginPath(); g.arc(ex, ey - 2, 5.4, 0, TAU); g.fill();
      g.fillStyle = '#f6f1ea'; g.beginPath(); g.arc(ex - 5, ey - 5, 2.4, 0, TAU); g.fill();
      { const gr = g.createLinearGradient(0, ey - 15, 0, ey + 2); gr.addColorStop(0, 'rgba(50,28,20,0.8)'); gr.addColorStop(0.45, 'rgba(60,36,26,0.3)'); gr.addColorStop(1, 'rgba(60,36,26,0)'); g.fillStyle = gr; g.fillRect(ex - 40, ey - 20, 80, 24); }
      g.restore();
      g.lineCap = 'round'; g.strokeStyle = '#1e100b'; g.lineWidth = 5.5; g.beginPath(); g.moveTo(ex - hw, ey + 2); g.quadraticCurveTo(ex - 2 * sd, ey - 17, ex + hw, ey + 1); g.stroke();      // the upper lid's edge
      g.strokeStyle = 'rgba(118,72,56,0.8)'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(ex - hw + 3, ey - 9); g.quadraticCurveTo(ex - 2 * sd, ey - 26, ex + hw - 2, ey - 9); g.stroke();      // its fold
      g.strokeStyle = 'rgba(156,98,86,0.6)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(ex - hw + 2, ey + 3); g.quadraticCurveTo(ex, ey + 14, ex + hw, ey + 1); g.stroke();
      // the brow: straight, heavy, low
      g.fillStyle = '#3c2416'; g.beginPath(); g.moveTo(X(sd * 0.11), Yp(0.205)); g.quadraticCurveTo(X(sd * 0.42), Yp(0.29), X(sd * 0.82), Yp(0.2)); g.quadraticCurveTo(X(sd * 0.44), Yp(0.195), X(sd * 0.11), Yp(0.14)); g.closePath(); g.fill();
      soft(X(sd * 0.36), Yp(0.2), 44, 9, '74,46,28', 0.55);
    }
    // his mouth: small, closed, firm
    g.fillStyle = '#a84a44'; g.beginPath(); g.moveTo(X(-0.3), Yp(-0.612)); g.quadraticCurveTo(X(-0.12), Yp(-0.555), X(0), Yp(-0.582)); g.quadraticCurveTo(X(0.12), Yp(-0.555), X(0.3), Yp(-0.608)); g.quadraticCurveTo(X(0), Yp(-0.628), X(-0.3), Yp(-0.612)); g.fill();
    g.fillStyle = '#c0655a'; g.beginPath(); g.moveTo(X(-0.27), Yp(-0.618)); g.quadraticCurveTo(X(0), Yp(-0.628), X(0.27), Yp(-0.614)); g.quadraticCurveTo(X(0), Yp(-0.735), X(-0.27), Yp(-0.618)); g.fill();
    soft(X(-0.04), Yp(-0.662), 18, 5, '232,160,146', 0.6);
    g.strokeStyle = '#6a2e2a'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(X(-0.31), Yp(-0.606)); g.quadraticCurveTo(X(0), Yp(-0.63), X(0.31), Yp(-0.602)); g.stroke();
    // his whiskers: red-brown, down before the ear and along the jaw
    for (const sd of [-1, 1]) {
      for (let q = 0; q <= 1; q += 0.06) soft(X(sd * lerp(1.22, 0.88, q)), Yp(lerp(0.1, -0.74, q)), lerp(34, 22, q), 24, '112,60,32', 0.5);
      for (let i = 0; i < 170; i++) {
        const q = rand(), th = sd * (lerp(1.24, 0.84, q) + (rand() - 0.5) * 0.3 * (1 - 0.4 * q)), Y = lerp(0.14, -0.8, q) + (rand() - 0.5) * 0.08, a = PI / 2 - sd * (0.5 + 0.5 * q) + (rand() - 0.5) * 0.9, l = 6 + 8 * rand();
        g.strokeStyle = ['rgba(122,68,36,0.6)', 'rgba(150,86,46,0.55)', 'rgba(92,52,30,0.6)', 'rgba(170,104,60,0.45)'][Math.floor(rand() * 4)]; g.lineWidth = 1.2 + 1.2 * rand();
        g.beginPath(); g.moveTo(X(th), Yp(Y)); g.quadraticCurveTo(X(th) + Math.cos(a) * l * 0.5 + 2, Yp(Y) + Math.sin(a) * l * 0.5, X(th) + Math.cos(a) * l, Yp(Y) + Math.sin(a) * l); g.stroke();
      }
    }
    // his hair: chestnut, in curls
    g.fillStyle = '#2b190f'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, Yp(hairline(PI)));
    for (let x = 0; x <= AT; x += 6) { const th = (x - 512) / R; g.lineTo(x, Yp(hairline(Math.abs(th))) + 5 * Math.sin(x * 0.11) + 3 * Math.sin(x * 0.27)); }
    g.lineTo(AT, 0); g.closePath(); g.fill();
    for (let i = 0; i < 520; i++) {
      const x = rand() * AT, th = (x - 512) / R, Y = lerp(hairline(Math.abs(th)) - 0.07, 1, rand()), r = 6 + 11 * rand(), a0 = rand() * TAU;
      g.strokeStyle = ['rgba(98,58,32,0.8)', 'rgba(130,82,46,0.7)', 'rgba(158,106,62,0.55)', 'rgba(60,34,20,0.85)', 'rgba(40,22,13,0.9)'][Math.floor(rand() * 5)]; g.lineWidth = 1.6 + 2.2 * rand();
      g.beginPath(); g.arc(x, Yp(Y), r, a0, a0 + 1.4 + 2.2 * rand()); g.stroke();
    }
    g.restore();

    // ------------------------------------------------ the coat: black silk on black cloth (how much, as a grey)
    const leaf = (x, y, a, l, w, v) => { const dx = Math.cos(a) * l, dy = Math.sin(a) * l, nx = -Math.sin(a) * w, ny = Math.cos(a) * w; g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + dx * 0.45 + nx, y + dy * 0.45 + ny, x + dx, y + dy); g.quadraticCurveTo(x + dx * 0.45 - nx, y + dy * 0.45 - ny, x, y); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.75)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx * 0.85, y + dy * 0.85); g.stroke(); };
    const worked = (x0, y0, x1, y1, inside, step = 15) => {
      for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) {
        const px = x + (rand() - 0.5) * step, py = y + (rand() - 0.5) * step; if (!inside(px, py)) continue;
        const flow = 2.4 * Math.sin(px * 0.023 + 1.3) * Math.cos(py * 0.029) + 1.7 * Math.sin(py * 0.017 + px * 0.008);
        if (rand() < 0.14) { for (let k = 0; k < 5; k++) leaf(px, py, flow + k * TAU / 5, 8 + 3 * rand(), 5, 200 + Math.floor(rand() * 55)); g.fillStyle = '#555'; g.beginPath(); g.arc(px, py, 2.4, 0, TAU); g.fill(); }
        else { leaf(px, py, flow + (rand() - 0.5) * 1.2, 14 + 9 * rand(), 5 + 3 * rand(), 150 + Math.floor(rand() * 105)); if (rand() < 0.6) leaf(px, py, flow + 2.2 + rand(), 9 + 6 * rand(), 4 + 2 * rand(), 130 + Math.floor(rand() * 90)); }
      }
    };
    const Yt = y => TOR_Y + (1 - (y - T_Y0) / (T_Y1 - T_Y0)) * TOR_H, CL = 0.03;      // (CL: where the coat closes)
    const wide = y => lerp(0.4, 0.8, sstep(y, 1.08, 1.4)) * (1 - 0.35 * sstep(y, 1.44, 1.53));
    const yOf = py => T_Y0 + (1 - (py - TOR_Y) / TOR_H) * (T_Y1 - T_Y0);
    g.save(); g.beginPath(); g.rect(0, TOR_Y, AT, TOR_H); g.clip();
    worked(0, TOR_Y, AT, TOR_Y + TOR_H, (px, py) => { const th = (px - 512) / R, y = yOf(py); return (Math.abs(th - CL) < wide(y) - 0.03 && y > 1.05 && y < 1.53) || (y > 1.05 && y < 1.112 && Math.abs(th) < 1.5); });
    g.strokeStyle = '#8a8a8a'; g.lineWidth = 3;
    for (const sd of [-1, 1]) { g.beginPath(); for (let y = 1.05; y <= 1.53; y += 0.01) { const px = X(CL + sd * wide(y)), py = Yt(y); if (y === 1.05) g.moveTo(px, py); else g.lineTo(px, py); } g.stroke(); }
    g.beginPath(); g.moveTo(X(-1.5), Yt(1.118)); g.lineTo(X(1.5), Yt(1.118)); g.stroke(); g.beginPath(); g.moveTo(X(-1.6), Yt(1.05)); g.lineTo(X(1.6), Yt(1.05)); g.stroke();
    g.strokeStyle = '#000'; g.lineWidth = 3; g.beginPath(); g.moveTo(X(CL), Yt(1.045)); g.lineTo(X(CL), Yt(1.5)); g.stroke();
    for (let y = 1.13; y < 1.44; y += 0.058) { g.fillStyle = '#000'; g.beginPath(); g.arc(X(CL + 0.075), Yt(y), 10, 0, TAU); g.fill(); g.fillStyle = '#d8d8d8'; g.beginPath(); g.arc(X(CL + 0.075), Yt(y), 7.5, 0, TAU); g.fill(); g.fillStyle = '#666'; g.beginPath(); g.arc(X(CL + 0.075), Yt(y), 3.5, 0, TAU); g.fill(); }
    g.restore();
    // the collar and the cuffs: worked all over
    g.save(); g.beginPath(); g.rect(192, TILE_Y, 512, 192); g.clip(); worked(192, TILE_Y, 704, AT, () => true, 13); g.strokeStyle = '#8a8a8a'; g.lineWidth = 3; g.strokeRect(198, TILE_Y + 6, 500, 180); g.restore();

    // ------------------------------------------------ the cross of the order: white enamel, a gold crown, its red ribbon
    g.clearRect(0, TILE_Y, 192, 192);
    { const cx = 96, cy = TILE_Y + 122, gold = '#d8ae4a', dark = '#8a6420';
      g.fillStyle = '#c63a22'; g.fillRect(cx - 15, TILE_Y, 30, 34); g.fillStyle = '#9c2a18'; g.fillRect(cx + 5, TILE_Y, 10, 34);
      g.fillStyle = gold; g.beginPath(); g.moveTo(cx - 17, TILE_Y + 60); g.lineTo(cx - 20, TILE_Y + 40); g.quadraticCurveTo(cx - 10, TILE_Y + 26, cx, TILE_Y + 30); g.quadraticCurveTo(cx + 10, TILE_Y + 26, cx + 20, TILE_Y + 40); g.lineTo(cx + 17, TILE_Y + 60); g.closePath(); g.fill();
      g.fillStyle = dark; g.fillRect(cx - 17, TILE_Y + 54, 34, 5); g.fillStyle = '#f6e6a8'; for (const dx of [-12, 0, 12]) { g.beginPath(); g.arc(cx + dx, TILE_Y + 42, 3, 0, TAU); g.fill(); }
      for (let k = 0; k < 5; k++) {
        const a = -PI / 2 + k * TAU / 5, P2 = (r, da) => [cx + Math.cos(a + da) * r, cy + Math.sin(a + da) * r];
        g.fillStyle = '#f4f1e8'; g.beginPath(); g.moveTo(...P2(9, 0)); g.lineTo(...P2(56, -0.27)); g.lineTo(...P2(42, 0)); g.lineTo(...P2(56, 0.27)); g.closePath(); g.fill();
        g.strokeStyle = gold; g.lineWidth = 2.5; g.stroke();
        g.fillStyle = '#c9cfc6'; g.beginPath(); g.moveTo(...P2(9, 0)); g.lineTo(...P2(42, 0)); g.lineTo(...P2(56, 0.27)); g.closePath(); g.fill();
        g.fillStyle = gold; for (const da of [-0.27, 0.27]) { g.beginPath(); g.arc(...P2(58, da), 3.6, 0, TAU); g.fill(); }
        g.fillStyle = '#3f7a48'; g.beginPath(); g.arc(...P2(27, PI / 5), 6, 0, TAU); g.fill();
      }
      g.fillStyle = gold; g.beginPath(); g.arc(cx, cy, 16, 0, TAU); g.fill(); g.fillStyle = dark; g.beginPath(); g.arc(cx, cy, 11, 0, TAU); g.fill(); g.fillStyle = '#f0d27a'; g.beginPath(); g.arc(cx, cy, 7, 0, TAU); g.fill();
    }
  });
}

// Two bones: from a to a target t, lengths l1 and l2, bent towards pole. Fills j (the joint) and e (the end).
const _ax = V3(), _pp = V3();
function reach(a, t, l1, l2, pole, j, e) {
  _ax.copy(t).sub(a); let d = _ax.length(); if (d < 1e-6) { _ax.set(0, -1, 0); d = 1e-6; } _ax.multiplyScalar(1 / d);
  const dd = Math.min(l1 + l2 - 1e-4, Math.max(Math.abs(l1 - l2) + 1e-4, d)), x = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  _pp.copy(pole).addScaledVector(_ax, -pole.dot(_ax)); if (_pp.lengthSq() < 1e-8) _pp.set(0, 0, 1).addScaledVector(_ax, -_ax.z); _pp.normalize();
  j.copy(a).addScaledVector(_ax, x).addScaledVector(_pp, h); e.copy(a).addScaledVector(_ax, dd);
}
// A part that hangs down its own -y, set from p towards q, its +z turned to front.
const _x = V3(), _y = V3(), _z = V3();
function hang(m, p, q, front) {
  _y.copy(p).sub(q).normalize(); _z.copy(front).addScaledVector(_y, -front.dot(_y)); if (_z.lengthSq() < 1e-8) _z.set(1, 0, 0).addScaledVector(_y, -_y.x); _z.normalize(); _x.crossVectors(_y, _z);
  return m.makeBasis(_x, _y, _z).setPosition(p);
}
const walkE = q => { const a = 0.16; q = clamp01(q); return q < a ? q * q / (2 * a * (1 - a)) : q > 1 - a ? 1 - (1 - q) * (1 - q) / (2 * a * (1 - a)) : (q - a / 2) / (1 - a); };

lifeFor(111317, {
  title: /Comte de Pastoret/,
  word: 'likeness',
  // (the camera stands a little to the left: his elbow and the hilt are on its side when he faces the picture, and the silk is behind him)
  stage: { out: 1.8, half: 1.0, cam: { dist: 2.25, side: -0.55, height: 0.72, fov: 58, lookU: 0.1, lookOut: 0.45, lookH: 0.9, floorOut: 1.05 } },
  wake: 2, ret: RET,

  build(L) {
    const P = L.pal, col = (h, a = 0.06) => P.near(h, a), rand = L.rand;
    const GL = (h, a) => { const c = col(h, a); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
    const BLACK = col('#0d0c0c', 0.1), FLESH = col('#e6bc9c', 0), LINEN = col('#efece4', 0), GOLD = col('#c9a044', 0), RED = col('#c4401f', 0), HAIRC = col('#3a2416', 0), PEARL = col('#e6e0d2', 0);
    const cloth = { kind: K.CLOTH, col: BLACK };

    // ---------------------------------------------------------- the coat's body, his left arm on his hip, the collar
    const torso = part();
    {
      let TH = 0;
      surf(torso, 56, 40, (a, b, out) => ringPt(row(TORSO, b), (a - 0.5) * TAU, out), { ...cloth, wrap: true, uv: (a, b, p) => torsoUV((a - 0.5) * TAU, p.y) });
      // the collar: a tall band, open in front, standing a little off his neck
      const gap = b => lerp(0.14, 1.0, Math.pow(b, 0.8));
      surf(torso, 44, 7, (a, b, out) => { TH = lerp(gap(b), TAU - gap(b), a); const back = (1 - Math.cos(TH)) / 2, y = lerp(1.495, lerp(1.6, 1.63, back), b), r = 1 + 0.14 * b + 0.16 * b * (1 - back); return out.set(0.073 * Math.sin(TH) * r, y, -0.014 + (Math.cos(TH) > 0 ? 0.076 : 0.082) * Math.cos(TH) * r); }, { ...cloth, uv: (a, b) => bandUV(a, b) });
      // his shirt collar, white, in two points up to the jaw; and the red at his throat
      for (const sd of [-1, 1]) surf(torso, 10, 4, (a, b, out) => { const th = sd * lerp(0.22, 1.5, a), top = lerp(1.575, 1.652, sstep(a, 0, 0.6)) - 0.035 * sstep(a, 0.75, 1); return out.set(0.066 * Math.sin(th) * (1 + 0.1 * b), lerp(1.5, top, b), -0.014 + 0.07 * Math.cos(th) * (1 + 0.1 * b)); }, { kind: K.LINEN, col: LINEN });
      tube(torso, line([0, 1.47, -0.014], [0, 1.578, -0.008]), capped(t => 0.062 + 0.003 * t, 0.001, 0.12), 14, 5, { kind: K.LINEN, col: LINEN });
      ball(torso, [0.004, 1.512, 0.052], [0.026, 0.05, 0.018], { kind: K.RED, col: RED }, 10, 6);
      // the cross, hung high
      { const w = 0.04, h = 0.04, bOf = y => { let lo = 0, hi = 1; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (row(TORSO, m)[0] < y) lo = m; else hi = m; } return lo; };
        surf(torso, 4, 6, (a, b, out) => { const y = 1.432 + (b - 0.5) * 2 * h; ringPt(row(TORSO, bOf(y)), 0, out); return out.set(-0.012 + (a - 0.5) * 2 * w, y, out.z + 0.006 - 22 * Math.pow((a - 0.5) * 2 * w, 2) * 0.1); }, { kind: K.CARD, uv: (a, b) => [(4 + a * 184) / AT, 1 - (TILE_Y + 188 - b * 184) / AT] }); }
      // his left arm: out from the shoulder, back to the elbow, and forward again to the hip
      const arm = curve([[0.13, 1.43, -0.004], [0.196, 1.412, -0.012], [0.3, 1.305, -0.046], [0.385, 1.185, -0.076], [0.326, 1.106, 0.004], [0.238, 1.047, 0.074]]);
      const ar = prof([[0, 0.05], [0.12, 0.062], [0.22, 0.066], [0.36, 0.06], [0.55, 0.054], [0.8, 0.046], [0.9, 0.042], [1, 0.042]]);
      tube(torso, arm, (t, ph) => ar(t), 16, 34, { ...cloth, uv: (a, b) => (b > 0.84 ? bandUV(a * 0.5, 0.3 + (b - 0.84) / 0.16 * 0.6) : [2 + a, b]), extra: (a, b) => 0.25 + 0.75 * gss(b - 0.56, 0.16) });
      const W = V3(0.238, 1.047, 0.074), d = V3(-0.757, -0.486, 0.432).normalize(), px = V3(-0.6, 0, -0.8); px.addScaledVector(d, -px.dot(d)).normalize();
      tube(torso, (t, out) => out.copy(W).addScaledVector(d, lerp(-0.012, 0.014, t)), () => 0.036, 12, 2, { kind: K.LINEN, col: LINEN });
      const yv = d.clone().negate(), zv = V3().crossVectors(px, yv).negate();      // (mirrored: a left hand)
      hand(torso, new THREE.Matrix4().makeBasis(px, yv, zv).setPosition(W.clone().addScaledVector(d, 0.012)), FLESH, { spread: 0.24, curl: 0.3 });
    }
    // ---------------------------------------------------------- his head
    const head = part();
    {
      const TH = a => { const s = 2 * a - 1; return PI * (0.45 * s + 0.55 * s * Math.pow(Math.abs(s), 1.2)); };
      surf(head, 64, 48, (a, b, out) => headAt(TH(a), (b - 0.5) * PI, out), { kind: K.FACE, wrap: true, uv: (a, b) => headUV(TH(a), Math.sin((b - 0.5) * PI)) });
      surf(head, 56, 40, (a, b, out) => { const th = (a - 0.5) * TAU, ph = (b - 0.5) * PI; return headAt(th, ph, out, hairThick(th, ph)); }, { kind: K.HAIR, col: HAIRC, wrap: true, uv: (a, b) => headUV((a - 0.5) * TAU, Math.sin((b - 0.5) * PI)), extra: (a, b) => Math.sin((b - 0.5) * PI) - hairline(Math.abs((a - 0.5) * TAU)) });
      for (const sd of [-1, 1]) ball(head, [sd * 0.079, 1.652, -0.004], [0.011, 0.03, 0.019], { kind: K.FLESH, col: FLESH }, 8, 6);
      tube(head, line([0, 1.44, -0.016], [0, 1.6, -0.006]), t => 0.055 + 0.004 * t, 14, 3, { kind: K.FLESH, col: FLESH });
    }
    // ---------------------------------------------------------- his right arm, in two; the hand at the end of it
    const armU = part(), armF = part();
    {
      tube(armU, line([0, 0.03, 0], [0, -AU - 0.01, 0]), capped(prof([[0, 0.058], [0.14, 0.065], [0.4, 0.06], [1, 0.052]]), 0.12, 0.08), 14, 14, { ...cloth, uv: (a, b) => [2 + a, b], extra: (a, b) => 0.2 + 0.8 * sstep(b, 0.55, 0.95) });
      const fr = prof([[0, 0.052], [0.5, 0.047], [0.86, 0.041], [1, 0.042]]);
      tube(armF, line([0, 0.02, 0], [0, -AF + 0.012, 0]), capped(fr, 0.1, 0.001), 14, 14, { ...cloth, uv: (a, b) => (b > 0.82 ? bandUV(0.5 + a * 0.5, 0.3 + (b - 0.82) / 0.18 * 0.6) : [2 + a, b]), extra: (a, b) => 0.2 + 0.8 * sstep(b, 0.4, 0.05) });
      tube(armF, line([0, -AF + 0.02, 0], [0, -AF - 0.012, 0]), () => 0.0355, 12, 2, { kind: K.LINEN, col: LINEN });
      hand(armF, new THREE.Matrix4().makeTranslation(0, -AF - 0.006, 0), FLESH, { spread: 0.05, curl: 0.62 });
    }
    // ---------------------------------------------------------- his hips, the tails of the coat, the sword at his hip
    const pelvis = part();
    {
      surf(pelvis, 32, 16, (a, b, out) => ringPt(row(PELVIS, b), (a - 0.5) * TAU, out), { ...cloth, wrap: true });
      // the tails: from the waist round behind him, down to the back of the knee, parted in the middle
      surf(pelvis, 28, 16, (a, b, out) => {
        const span = lerp(1.75, 0.95, sstep(b, 0, 0.9)), s = 2 * a - 1, th = PI + s * span, R = [lerp(1.075, 0.52, b), 0, 0.146 * (1 + 0.1 * b), 0.11, 0.107 * (1 + 0.42 * Math.sin(b * PI * 0.6)), 2.3];
        ringPt(R, th, out, 1.03); out.z += 0.006 * b * Math.cos(s * 9); out.x += 0.012 * b * Math.sign(s) * gss(s, 0.12); return out;
      }, cloth);
      // the sword: its hilt before his hip, under his hand; the scabbard down and back behind his leg. It hangs there.
      const g0 = V3(0.212, 0.905, 0.07), up = V3(0.02, 0.95, 0.31).normalize(), at = (k, o = V3()) => o.copy(g0).addScaledVector(up, k), fwd = V3(0, -0.31, 0.95).normalize(), gold = { kind: K.GOLD, col: GOLD };
      tube(pelvis, (t, out) => at(lerp(0.012, 0.105, t), out), capped(t => 0.0125 + 0.003 * Math.sin(PI * t), 0.05, 0.05), 10, 6, { kind: K.PEARL, col: PEARL });
      { const p = at(0.122); ball(pelvis, [p.x, p.y, p.z], [0.019, 0.022, 0.019], gold, 10, 6); const q = at(0.004); ball(pelvis, [q.x, q.y, q.z], [0.04, 0.012, 0.03], gold, 12, 6); }
      { const a0 = at(0.118), a1 = at(0.06).addScaledVector(fwd, 0.062), a2 = at(0.006).addScaledVector(fwd, 0.036); tube(pelvis, curve([a0.toArray(), a1.toArray(), a2.toArray()]), capped(() => 0.0065, 0.04, 0.04), 8, 12, gold); }
      const tip = at(-0.62);
      tube(pelvis, (t, out) => at(lerp(-0.002, -0.62, t), out), capped(t => lerp(0.014, 0.009, t), 0.001, 0.03), 8, 10, { kind: K.SHOE, col: BLACK });
      tube(pelvis, (t, out) => at(lerp(-0.002, -0.05, t), out), () => 0.0152, 8, 2, gold);
      tube(pelvis, (t, out) => out.copy(tip).addScaledVector(up, lerp(0.07, -0.004, t)), capped(t => lerp(0.0105, 0.008, t), 0.001, 0.2), 8, 4, gold);
      // the seal at his watch ribbon, on the other side
      ball(pelvis, [-0.098, 1.0, 0.108], [0.017, 0.021, 0.014], gold, 8, 6); tube(pelvis, line([-0.098, 1.06, 0.1], [-0.098, 1.015, 0.108]), () => 0.007, 6, 2, { kind: K.RED, col: col('#3a1410', 0) });
    }
    // ---------------------------------------------------------- his legs (ours: the picture stops above them), plain
    const thigh = part(), shin = part(), shoe = part();
    {
      tube(thigh, line([0, 0.05, 0], [0, -THIGH - 0.02, 0]), capped(prof([[0, 0.1], [0.25, 0.101], [1, 0.075]]), 0.16, 0.1), 14, 12, { ...cloth, uv: (a, b) => [2 + a, b], extra: (a, b) => 0.3 + 0.5 * sstep(b, 0.6, 0.95) + 0.3 * sstep(b, 0.3, 0.05) });
      tube(shin, line([0, 0.04, 0], [0, -SHIN + 0.015, 0]), capped(prof([[0, 0.074], [0.3, 0.071], [0.8, 0.062], [1, 0.064]]), 0.12, 0.001), 14, 12, { ...cloth, uv: (a, b) => [2 + a, b], extra: (a, b) => 0.3 + 0.5 * sstep(b, 0.35, 0.05) + 0.5 * sstep(b, 0.75, 1) });
      surf(shoe, 14, 9, (a, b, out) => { const th = a * TAU, ph = (b - 0.5) * PI, cp = Math.cos(ph), z = Math.cos(th) * cp; return out.set(0.044 * Math.sin(th) * cp * (1 - 0.18 * Math.max(0, z)), -0.026 + 0.033 * Math.sin(ph) * (1 - 0.3 * Math.max(0, z)), 0.045 + 0.118 * z); }, { kind: K.SHOE, col: BLACK, wrap: true });
    }

    // ---------------------------------------------------------- the rig: all of him, one draw call
    const parts = { pelvis, torso, head, armU, armF, thigh, shin, shoe };
    const origin = { pelvis: [0, HIP, 0], torso: [0, WAIST, 0], head: NECK, armU: [0, 0, 0], armF: [0, 0, 0], thigh: [0, 0, 0], shin: [0, 0, 0], shoe: [0, 0, 0] };
    let total = 0; for (const p of Object.values(parts)) total += p.pos.length / 3;
    const atlas = paintAtlas(rand); atlas.anisotropy = 4;
    const sun = V3().addScaledVector(V3(L.tx, 0, L.tz), -0.42).addScaledVector(V3(L.nx, 0, L.nz), 0.72).add(V3(0, 0.55, 0)).normalize();      // his light: from the upper left, in front
    const u = this.u = { uAtlas: { value: atlas }, uSun: { value: sun }, uWall: { value: new THREE.Vector4(L.nx, 0, L.nz, L.cx * L.nx + L.cz * L.nz) }, uCalm: { value: 0 } };
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false });
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aK; varying vec2 vK, vUv2; varying vec3 vWN, vWP;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  vK = aK; vUv2 = uv;
  #ifdef USE_BATCHING
    vWN = normalize(mat3(modelMatrix) * (mat3(batchingMatrix) * normal)); vWP = (modelMatrix * (batchingMatrix * vec4(position, 1.0))).xyz;
  #else
    vWN = normalize(mat3(modelMatrix) * normal); vWP = (modelMatrix * vec4(position, 1.0)).xyz;
  #endif`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform sampler2D uAtlas; uniform vec3 uSun; uniform vec4 uWall; uniform float uCalm; varying vec2 vK, vUv2; varying vec3 vWN, vWP;
float pH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float pN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(pH(i), pH(i + vec2(1.0, 0.0)), f.x), mix(pH(i + vec2(0.0, 1.0)), pH(i + vec2(1.0, 1.0)), f.x), f.y); }`)
        .replace('#include <opaque_fragment>', `{
  if (dot(vWP.xz, uWall.xz) - uWall.w < -0.03) discard;                 // (still in the wall)
  int kind = int(vK.x + 0.5);
  vec3 N = normalize(vWN); if (!gl_FrontFacing) N = -N;
  vec3 Vd = normalize(cameraPosition - vWP), Hh = normalize(uSun + Vd);
  float nl = dot(N, uSun), nv = max(dot(N, Vd), 0.0), nh = max(dot(N, Hh), 0.0), lit = smoothstep(-0.5, 0.7, nl);
  vec4 tx = vUv2.x >= 0.0 && vUv2.x < 1.5 ? texture2D(uAtlas, vUv2) : vec4(0.0, 0.0, 0.0, 1.0);
  vec3 c = vColor;
  if (kind == ${K.CLOTH} || kind == ${K.SHOE}) {
    // his black: nearly nothing in the shadow, a grey bloom where the cloth turns to the light, and along its edge
    float bloom = smoothstep(-0.25, 1.0, nl), rim = pow(1.0 - nv, 3.0) * smoothstep(-0.4, 0.4, nl);
    c = mix(${GL('#0b0a0a', 0.1)}, ${GL('#45423f', 0.08)}, clamp(0.8 * bloom + 0.5 * rim + 0.1 * smoothstep(-0.6, 0.6, N.y), 0.0, 1.0));
    c = mix(c, ${GL('#6a6763', 0.06)}, 0.4 * pow(nh, 4.0) * smoothstep(0.0, 0.6, nl));
    if (kind == ${K.SHOE}) c = mix(c, ${GL('#8c8a86', 0.03)}, 0.7 * pow(nh, 24.0));
    if (vUv2.x > 1.5) {
      // a sleeve or a trouser leg: soft folds across it where it bends, as lights and hollows in the black
      float fa = (vUv2.x - 2.0) * 6.2832, ft = vUv2.y, fold = sin(ft * 34.0 + 2.2 * sin(fa + 1.0) + 5.0 * pN(vec2(fa * 0.8, ft * 5.0))) * vK.y;
      c = mix(c, ${GL('#55524e', 0.06)}, 0.3 * max(fold, 0.0) * smoothstep(-0.2, 0.7, nl));
      c *= 1.0 - 0.45 * max(-fold, 0.0);
    }
    // the embroidery: black silk on it, found where the light catches it
    float m = vUv2.x < 1.5 ? tx.r : 0.0;
    c = mix(c, ${GL('#6e6b66', 0.05)}, clamp(m * (0.13 + 0.25 * smoothstep(-0.7, 0.85, nl) + 0.45 * pow(nh, 9.0)), 0.0, 0.85));
  } else if (kind == ${K.FLESH} || kind == ${K.FACE}) {
    // his flesh: pale, close in tone, turning to a warmer shade at its edge
    vec3 a = kind == ${K.FACE} ? tx.rgb : vColor;
    c = a * mix(vec3(0.6, 0.49, 0.44), vec3(1.03, 1.0, 0.97), lit);
    c = mix(c, a * vec3(0.5, 0.36, 0.31), 0.5 * pow(1.0 - nv, 2.4));
  } else if (kind == ${K.HAIR}) {
    float rag = pN(vUv2 * vec2(150.0, 70.0));
    if (vK.y + 0.07 * (rag - 0.5) < 0.0) discard;
    // ringlets: each a small dark hollow with a crescent of light round it, on the side his light comes from
    vec2 hp = vUv2 * vec2(58.0, 30.0), ip = floor(hp), fp = fract(hp), cc = vec2(0.0); float d1 = 9.0;
    for (int yy = -1; yy <= 1; yy++) for (int xx = -1; xx <= 1; xx++) { vec2 gc = vec2(float(xx), float(yy)), r = gc + vec2(pH(ip + gc), pH(ip + gc + 7.7)) - fp; float d = dot(r, r); if (d < d1) { d1 = d; cc = r; } }
    float cd = sqrt(d1), ringlet = smoothstep(0.16, 0.34, cd) * smoothstep(0.7, 0.46, cd), cres = 0.5 + 0.5 * sin(atan(cc.y, cc.x) + 2.4 + 3.0 * pH(ip));
    float lock = pN(vUv2 * vec2(30.0, 16.0) + 7.0), up = smoothstep(-0.3, 0.8, nl);
    c = mix(${GL('#120905', 0.03)}, ${GL('#43260f', 0.03)}, up * (0.4 + 0.6 * lock));
    c = mix(c, ${GL('#74461f', 0.03)}, ringlet * cres * (0.2 + 0.8 * up) * 0.7 + 0.25 * pow(nh, 9.0) * ringlet);
    c = mix(c, ${GL('#0c0604', 0.03)}, 0.65 * smoothstep(0.5, 0.75, cd) + 0.4 * smoothstep(0.2, 0.05, cd));
  } else if (kind == ${K.LINEN}) {
    c = mix(${GL('#8f8c88', 0.03)}, ${GL('#f4f1ea', 0.02)}, smoothstep(-0.35, 0.6, nl));
  } else if (kind == ${K.GOLD}) {
    float chase = pN(vWP.xy * 420.0 + vWP.z * 310.0);
    c = mix(${GL('#4a3210', 0.03)}, ${GL('#c69a3c', 0.03)}, smoothstep(-0.4, 0.6, nl + 0.35 * (chase - 0.5)));
    c = mix(c, ${GL('#fbe9a6', 0.02)}, smoothstep(0.78, 0.96, nh + 0.1 * (chase - 0.5)) * mix(1.0, 0.45, uCalm) + 0.25 * uCalm * smoothstep(0.3, 0.9, nl));
  } else if (kind == ${K.RED}) {
    c = vColor * (0.5 + 0.65 * lit);
  } else if (kind == ${K.PEARL}) {
    c = mix(${GL('#7c766a', 0.03)}, ${GL('#f2ecdf', 0.02)}, lit); c = mix(c, vec3(1.0), 0.5 * pow(nh, 14.0));
  } else if (kind == ${K.CARD}) {
    if (tx.a < 0.5) discard;
    c = tx.rgb * (0.72 + 0.4 * lit) + vec3(0.2, 0.19, 0.15) * pow(nh, 14.0) * mix(1.0, 0.4, uCalm);
  }
  outgoingLight = c * 0.6;
}
#include <opaque_fragment>`);
    };
    mat.customProgramCacheKey = () => 'ingres-pastoret';
    const rig = this.rig = L.rig(12, total + 64, mat), gid = {};
    for (const [name, p] of Object.entries(parts)) {
      const g = new THREE.BufferGeometry(), o = origin[name], pos = new Float32Array(p.pos);
      for (let i = 0; i < pos.length; i += 3) { pos[i] -= o[0]; pos[i + 1] -= o[1]; pos[i + 2] -= o[2]; }
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(p.nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(p.col, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(p.uv, 2)); g.setAttribute('aK', new THREE.Float32BufferAttribute(p.k, 2));
      gid[name] = rig.geo(g); p.pos = p.nor = p.col = p.uv = p.k = null;
    }
    const I = this.I = { pelvis: rig.add(gid.pelvis), torso: rig.add(gid.torso), head: rig.add(gid.head), armU: rig.add(gid.armU), armF: rig.add(gid.armF), thigh: [rig.add(gid.thigh), rig.add(gid.thigh)], shin: [rig.add(gid.shin), rig.add(gid.shin)], shoe: [rig.add(gid.shoe), rig.add(gid.shoe)] };
    this.all = [I.pelvis, I.torso, I.head, I.armU, I.armF, ...I.thigh, ...I.shin, ...I.shoe];
    const M4 = () => new THREE.Matrix4();
    this.M = { root: M4(), pelvis: M4(), torso: M4(), head: M4(), a: M4(), b: M4(), out: M4() };
    this.v = { hip: V3(), knee: V3(), ank: V3(), end: V3(), pole: V3(), sh: V3(), el: V3(), wr: V3(), tg: V3(), tg2: V3(), th: V3(), p: V3(), e: new THREE.Euler(0, 0, 0, 'YXZ'), q: new THREE.Quaternion(), s: V3(1, 1, 1), z: V3() };

    // ---------------------------------------------------------- the silk: one sheet, let down from under the frame
    this.buildSilk(L, col);
    this.blobs = L.blobs(4, { y: L.y + 0.012, fade: true }); this.blobs.renderOrder = 6;

    // ---------------------------------------------------------- his way, his steps, the sounds
    const wc = new THREE.CatmullRomCurve3(WAY.map(p => V3(p[0], 0, p[1])), false, 'centripetal'); wc.arcLengthDivisions = 200; wc.updateArcLengths();
    this.way = wc; this.wp = V3(); this.wd = V3();
    wc.getTangentAt(1, this.wd); this.psiEnd = Math.atan2(this.wd.x, this.wd.z);
    // (when he has come through the silk, and it falls to behind him)
    this.tThrough = T_WALK[1]; for (let t = T_WALK[0]; t < T_WALK[1]; t += 0.01) { wc.getPointAt(walkE(ramp(t, T_WALK[0], T_WALK[1])), this.wp); if (this.wp.z > 0.36) { this.tThrough = t; break; } }
    const steps = [];
    for (let k = 0; k < 5; k++) steps.push({ f: k % 2 ? 0 : 1, t0: 0.92 + 0.475 * k, t1: 1.3 + 0.475 * k, lead: k < 4 ? 0.24 : 0.1 });
    steps.push({ f: 0, t0: 3.2, t1: 3.46, lead: 0.14 }, { f: 1, t0: 3.46, t1: 3.72, lead: 0.14 }, { f: 0, t0: 3.72, t1: 3.96, lead: 0.2 }, { f: 1, t0: 3.96, t1: 4.2, lead: 0.25 });
    const glance = (a, b) => steps.push({ f: 0, t0: a + 0.02, t1: a + 0.38, lead: 0.4 }, { f: 1, t0: a + 0.4, t1: a + 0.68, lead: 0.12 }, { f: 1, t0: b + 0.05, t1: b + 0.36, lead: 0.5 }, { f: 0, t0: b + 0.38, t1: b + 0.7, lead: 0.15 });
    glance(G0, G1); glance(T_LOOP + LG0, T_LOOP + LG1);
    this.o = {}; this.o2 = {};
    this.steps = this.plant(steps, t => this.bodyShow(t, false, this.o2));
    this.feet = [{ u: 0, out: 0, yaw: 0, lift: 0, q: 0 }, { u: 0, out: 0, yaw: 0, lift: 0, q: 0 }];

    const s = this.sc = score(L);
    s.hit(T_DROP[0], { d: 0.9, vol: 0.016, bp: 5200, q: 0.6, attack: 0.3 }); s.hit(T_DROP[1] - 0.05, { d: 0.25, vol: 0.01, bp: 3800, q: 0.7, attack: 0.02 });      // the silk comes down
    s.hit(1.15, { d: 0.6, vol: 0.014, bp: 4800, q: 0.6, attack: 0.2 }); s.hit(this.tThrough, { d: 0.7, vol: 0.011, bp: 5000, q: 0.6, attack: 0.25 });               // is put aside, and falls to
    for (const st of steps) if (st.t1 > 1.5 && st.t1 < T_LOOP) { s.hit(st.t1, { d: 0.08, vol: st.t1 < 3.3 ? 0.022 : 0.013, lp: 380 }); s.hit(st.t1 + 0.01, { d: 0.03, vol: 0.006, bp: 2300, q: 1.2 }); }      // his steps on the boards
    s.note(T_UP[1] - 0.1, 196, 2.6, { type: 'sine', vol: 0.02, attack: 0.5 }); s.note(T_UP[1] + 0.1, 293.66, 2.2, { type: 'sine', vol: 0.009, attack: 0.7 });      // he looks at the picture
    s.note(G0 + 0.75, 196, 2.4, { type: 'sine', vol: 0.022, attack: 0.25 }); s.note(G0 + 0.95, 246.94, 2.2, { type: 'sine', vol: 0.016, attack: 0.3 });           // and at you
    s.done();
    this.hold = null; this.hide();
  },

  buildSilk(L, col) {
    const nu = 44, nv = 30, geo = new THREE.PlaneGeometry(1, 1, nu, nv), GLc = (h, a = 0.3) => { const c = col(h, a); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
    const top = Math.min(L.rail - 0.012, L.y + 1.02) - L.y, o = L.floor(SILK.u0, 0);
    const u = this.su = { uO: { value: V3(o.x, L.y, o.z) }, uT: { value: V3(L.tx, 0, L.tz) }, uNn: { value: V3(L.nx, 0, L.nz) }, uDrop: { value: 0 }, uOpen: { value: 0 }, uBulge: { value: new THREE.Vector2() }, uSway: { value: new THREE.Vector2() }, uSun: { value: this.u.uSun.value } };
    const m = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, fog: false });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
uniform vec3 uO, uT, uNn; uniform float uDrop, uOpen; uniform vec2 uSway, uBulge; varying vec3 vSN, vSP; varying vec2 vS;
// the cloth: s across it, v down it from under the frame
vec3 silk(float s, float v) {
  float W = ${(SILK.u1 - SILK.u0).toFixed(3)}, H = ${top.toFixed(3)}, hangs = smoothstep(0.0, 0.3, v), bunch = 1.0 - uDrop;
  float x = (0.5 + (s - 0.5) * mix(0.66, 1.14, pow(v, 0.7))) * W;
  float f1 = sin(s * 19.0 + 1.5 * sin(s * 7.0 + 0.6 + 0.8 * v) + 0.7), f2 = sin(s * 53.0 + 2.0 * v + 1.9 + 2.0 * sin(s * 11.0));
  float z = ${SILK.deep.toFixed(3)} + (0.034 * f1 * (0.5 + 0.5 * v) + 0.008 * f2) * (1.0 + 1.6 * bunch) + 0.012 * v;
  // put aside from behind: its near edge is carried over to the right and out, the folds closing up
  float lw = pow(1.0 - s, 1.5);
  x += uOpen * lw * hangs * 0.25; z += uOpen * hangs * (0.05 * sin(3.1416 * clamp((1.0 - s) * 1.25, 0.0, 1.0)) + 0.02 * f1 * lw);
  // someone behind it: it stands out over him, from his head down
  float bx = (x - uBulge.x) / 0.105; z += uBulge.y * exp(-bx * bx) * smoothstep(0.17, 0.3, v) * (0.8 + 0.2 * smoothstep(1.0, 0.55, v));
  x += uSway.x * v * v * (0.05 + 0.05 * lw); z += uSway.y * v * v * 0.03 * (1.0 + 0.5 * f1);
  float y = H * (1.0 - v * uDrop) + 0.004 * f1 * bunch;
  // where it meets the boards it breaks a little
  float fl = smoothstep(0.92, 1.0, v) * uDrop; z += 0.02 * fl * (1.0 + 0.6 * f1); y = max(y, 0.004);
  return uO + uT * x + uNn * z + vec3(0.0, y, 0.0);
}`).replace('#include <begin_vertex>', `float ss = uv.x, sv = 1.0 - uv.y; vec3 sp = silk(ss, sv), sa = silk(ss + 0.004, sv) - silk(ss - 0.004, sv), sb = silk(ss, sv + 0.01) - silk(ss, sv - 0.01);
  vSN = normalize(cross(sb, sa)); vSP = sp; vS = vec2(ss, sv);
  vec3 transformed = sp;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform vec3 uSun, uNn, uT; uniform float uDrop; varying vec3 vSN, vSP; varying vec2 vS;
float sH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float sN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(sH(i), sH(i + vec2(1.0, 0.0)), f.x), mix(sH(i + vec2(0.0, 1.0)), sH(i + vec2(1.0, 1.0)), f.x), f.y); }`)
        .replace('#include <opaque_fragment>', `{
  if (uDrop < 0.02) discard;
  vec3 N = normalize(vSN); if (dot(N, uNn) < 0.0) N = -N;
  // taffeta: crumpled, so its lights are hard and broken
  float st = sN(vec2(vS.x * 64.0, vS.y * 5.0 * uDrop + 3.0)) - 0.5, cr = sN(vec2(vS.x * 20.0, vS.y * 26.0 * uDrop)) - 0.5, cr2 = sN(vec2(vS.x * 47.0 + 9.0, vS.y * 70.0 * uDrop)) - 0.5;
  N = normalize(N + uT * (0.7 * st + 0.12 * cr) + vec3(0.0, 0.16 * cr + 0.1 * cr2, 0.0));
  vec3 Vd = normalize(cameraPosition - vSP), Hh = normalize(uSun + Vd);
  float nl = dot(N, uSun), nh = max(dot(N, Hh), 0.0), hollow = dot(normalize(vSN), uNn);
  vec3 c = mix(${GLc('#06150d')}, ${GLc('#123f27')}, smoothstep(-0.45, 0.3, nl));
  c = mix(c, ${GLc('#26683f')}, 0.85 * smoothstep(0.3, 0.9, nl));
  c = mix(c, ${GLc('#6fb884', 0.12)}, 0.7 * smoothstep(0.9, 0.99, nh + 0.04 * cr2));
  c *= 0.5 + 0.5 * smoothstep(0.1, 0.75, abs(hollow));                    // (dark down in the folds)
  c *= 1.0 - 0.3 * smoothstep(0.9, 1.0, vS.y);
  outgoingLight = c * 0.6;
}
#include <opaque_fragment>`);
    };
    m.customProgramCacheKey = () => 'ingres-pastoret-silk';
    this.silk = new THREE.Mesh(geo, m); this.silk.name = 'pastoret-silk'; L.add(this.silk);
  },

  hide() { for (const i of this.all) this.rig.show(i, false); this.rig.mesh.visible = false; this.silk.visible = false; this.blobs.count = 0; this.blobs.visible = false; },

  // ---------------------------------------------------------------- where he is and how he holds himself at show-time t
  bodyShow(t, calm, o) {
    const tf = t < T_LOOP ? t : T_LOOP + ((t - T_LOOP) % PER), slow = calm ? 1.5 : 1, w = this.way;
    const q = ramp(tf, T_WALK[0], T_WALK[1]), s = walkE(q);
    w.getPointAt(s, this.wp); w.getTangentAt(s, this.wd);
    o.u = this.wp.x; o.out = this.wp.z; o.going = q <= 0 || q >= 1 ? 0 : clamp01(Math.min(q, 1 - q) / 0.12); o.ph = (tf - 0.92) / 0.475 * PI;
    const turn = ease.inOut(ramp(tf, T_TURN[0], T_TURN[0] + (T_TURN[1] - T_TURN[0]) * slow));
    let psi = lerp(Math.atan2(this.wd.x, this.wd.z), -PI, turn);
    // looking round at you, and back
    const gl = (a, b) => ease.inOut(ramp(tf, a, a + 0.75 * slow)) * (1 - ease.inOut(ramp(tf, b, b + 0.8 * slow)));
    const g = Math.max(gl(G0, G1), gl(T_LOOP + LG0, T_LOOP + LG1));
    const gh = (a, b) => ease.inOut(ramp(tf, a - 0.12, a + 0.55 * slow)) * (1 - ease.inOut(ramp(tf, b - 0.1, b + 0.6 * slow)));
    const h = Math.max(gh(G0, G1), gh(T_LOOP + LG0, T_LOOP + LG1));
    psi += 0.92 * g; o.psi = psi; o.g = g; o.gh = h;
    const up = ease.inOut(ramp(tf, T_UP[0], T_UP[1])) * (1 - h);
    const nod = hump(tf, G0 + 1.25, G0 + 1.8) + hump(tf, T_LOOP + LG0 + 1.2, T_LOOP + LG0 + 1.75);
    const tilt = ease.inOut(ramp(tf, T_TILT[0], T_TILT[1])) * (1 - h), loopT = tf - T_LOOP, other = loopT > 0 ? ease.inOut(ramp(loopT, 1.2, 2.2)) * (1 - ease.inOut(ramp(loopT, 8.2, 9.2))) : 0;
    o.twist = 0.42 * g + 0.05 * Math.sin(o.ph) * o.going;
    o.hy = 1.02 * h; o.hp = -0.08 * (1 - up) * (1 - h) - 0.6 * up - 0.1 * h + 0.13 * nod; o.hr = (0.1 - 0.2 * other) * tilt * up;
    o.lean = -0.1 * up + 0.03 * o.going; o.side = (0.03 - 0.06 * other) * tilt;
    o.hand = ease.inOut(ramp(tf, T_HAND[0], T_HAND[1])); o.breath = Math.sin(t * 1.5);
    o.stand = ease.inOut(ramp(tf, T_TURN[1], T_TURN[1] + 0.7)) * (1 - 2 * other);      // (his weight on one leg; later, the other)
    o.vis = tf > T_WALK[0] - 0.05;
    return o;
  },
  // going home: r of the way back
  bodyBack(tau, calm, o) {
    const h = this.hold, q = ramp(tau, 0.5, 2.25), s = walkE(q), w = 1 - s;
    o.u = w * w * h.u + 2 * w * s * h.vu + s * s * HOME[0]; o.out = w * w * h.out + 2 * w * s * h.vo + s * s * HOME[1];
    const du = (h.vu - h.u) * w + (HOME[0] - h.vu) * s, dout = (h.vo - h.out) * w + (HOME[1] - h.vo) * s;
    o.psi = turnTo(h.psi, Math.atan2(du, dout), ease.inOut(ramp(tau, 0.05, 0.85)));
    o.going = q <= 0 || q >= 1 ? 0 : clamp01(Math.min(q, 1 - q) / 0.12); o.ph = (tau - 0.3) / 0.42 * PI; o.g = 0; o.gh = 0;
    const k = 1 - ease.inOut(ramp(tau, 0, 0.5));
    o.twist = h.twist * k + 0.05 * Math.sin(o.ph) * o.going; o.hy = h.hy * k; o.hp = lerp(-0.06, h.hp, k); o.hr = h.hr * k; o.lean = h.lean * k + 0.03 * o.going; o.side = h.side * k;
    o.hand = h.hand * (1 - ease.inOut(ramp(tau, 0.2, 0.8))); o.breath = 0; o.stand = h.stand * k; o.vis = h.vis;
    return o;
  },
  // Where each step comes down: under where he will be a moment after it lands.
  plant(steps, body) {
    const at = (t, f) => { const o = body(t), sg = f === 0 ? 1 : -1, c = Math.cos(o.psi), s = Math.sin(o.psi), w = 0.1 * S; return { u: o.u + c * sg * w, out: o.out - s * sg * w, yaw: o.psi + sg * 0.2 }; };
    steps.start = [at(steps.t00 || 0, 0), at(steps.t00 || 0, 1)];
    for (const st of steps) st.p = at(st.t1 + st.lead, st.f);
    return steps;
  },
  footAt(steps, t, f, out) {
    let prev = steps.start[f], cur = null;
    for (const st of steps) { if (st.f !== f) continue; if (st.t0 > t) break; if (cur) prev = cur.p; cur = st; }
    if (!cur) { out.u = prev.u; out.out = prev.out; out.yaw = prev.yaw; out.lift = 0; out.q = 0; return out; }
    const q = clamp01((t - cur.t0) / (cur.t1 - cur.t0)), e = ease.smooth(q), far = Math.hypot(cur.p.u - prev.u, cur.p.out - prev.out) / S;
    out.u = lerp(prev.u, cur.p.u, e); out.out = lerp(prev.out, cur.p.out, e); out.yaw = turnTo(prev.yaw, cur.p.yaw, e);
    out.lift = q < 1 ? Math.sin(PI * q) * (0.025 + 0.035 * Math.min(1, far / 0.5)) : 0; out.q = q < 1 ? q : 0;
    return out;
  },

  start(L) { this.sc.from(0); this.hold = null; this.told = false; },
  back(L) {
    const h = this.bodyShow(L.t, L.calm, {}), tf = L.t < T_LOOP ? L.t : T_LOOP + ((L.t - T_LOOP) % PER);
    h.vu = lerp(h.u, HOME[0], 0.75); h.vo = Math.max(0.12, h.out * 0.45);
    const steps = []; for (let k = 0; k < 6; k++) steps.push({ f: k % 2, t0: 0.3 + 0.42 * k, t1: 0.66 + 0.42 * k, lead: 0.2 });
    this.hold = h;
    this.plant(steps, t => this.bodyBack(t, false, this.o2));
    steps.start = [this.footAt(this.steps, tf, 0, {}), this.footAt(this.steps, tf, 1, {})];
    h.steps = steps;
    if (!L.quiet && h.vis && h.out > 0.2) for (const st of steps) if (st.t1 < 2.0) this.sc.fire(L.voice(), { noise: true, d: 0.08, vol: 0.013, lp: 380 }, st.t1);
  },
  end() { this.hide(); this.hold = null; },
  reset() { this.hide(); this.hold = null; this.told = false; },

  aside(L, toy, u, out, r, dt) {
    if (out < 0.08) return;
    const p = L.floor(u, out, this.v.p), dx = toy.pos.x - p.x, dz = toy.pos.z - p.z, d = Math.hypot(dx, dz), reachd = r + (toy.radius || 0.16);
    if (d >= reachd) return;
    const k = Math.min(reachd - d, 0.9 * dt);
    if (d > 1e-3) { toy.pos.x += dx / d * k; toy.pos.z += dz / d * k; } else { toy.pos.x += L.nx * k; toy.pos.z += L.nz * k; }
  },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return';
    if (!showing && !back) { this.hide(); return; }
    if (back && !this.hold) this.back(L);
    const calm = L.calm, t = L.t, v = this.v, M = this.M, rig = this.rig, I = this.I, tau = back ? L.ret * RET : 0;
    if (showing) this.sc.play(t);
    const voice = L.voice(); voice.level = calm ? 0.55 : 1; voice.place();
    if (showing && !this.told && !L.quiet && t > T_UP[0]) { this.told = true; L.k.say('He commissioned this likeness from his friend Ingres, and it stayed in his family until 1890. He comes round to look at it.', 6); }
    this.u.uCalm.value = calm ? 1 : 0;

    // ---- the silk
    const su = this.su; let drop, open, sx = 0, sz = 0;
    const o = back ? this.bodyBack(tau, calm, this.o) : this.bodyShow(t, calm, this.o);
    const through = sstep(o.out, 0.0, 0.1) * (1 - sstep(o.out, 0.24, 0.42)), behind = sstep(o.out, -0.24, -0.07) * (1 - sstep(o.out, 0.03, 0.13));
    if (!back) {
      const d1 = calm ? T_DROP[1] + 0.5 : T_DROP[1], qd = ramp(t, T_DROP[0], d1); drop = qd * qd * (3 - 2 * qd) * 0.35 + 0.65 * qd * qd;
      if (!calm) { const a = t - d1, b = t - this.tThrough; if (a > 0) sz += 0.9 * Math.exp(-2.6 * a) * Math.sin(7.5 * a); if (b > 0) { sx += -1.0 * Math.exp(-2.4 * b) * Math.sin(6.5 * b); sz += 0.6 * Math.exp(-2.4 * b) * Math.sin(8 * b + 1); } sx += 0.06 * Math.sin(t * 0.9); }
    } else { drop = 1 - ease.inOut(ramp(tau, RET - 0.5, RET - 0.02)); if (!this.hold.vis || this.hold.out < 0) drop = Math.min(drop, 1 - ease.inOut(ramp(tau, 0.1, 0.9))); }
    open = through * (o.vis ? 1 : 0);
    su.uDrop.value = drop; su.uOpen.value = open; su.uSway.value.set(sx, sz); su.uBulge.value.set(o.u - SILK.u0, 0.09 * behind * (o.vis ? 1 : 0) * drop);
    this.silk.visible = drop > 0.02; this.rig.mesh.visible = true; this.blobs.visible = true;

    // ---- him
    const vis = o.vis && (!back || L.ret < 0.995);
    for (const i of this.all) rig.show(i, vis);
    const psi = o.psi, cs = Math.cos(psi), sn = Math.sin(psi), steps = back ? this.hold.steps : this.steps, tt = back ? tau : (t < T_LOOP ? t : T_LOOP + ((t - T_LOOP) % PER));
    // his feet, where they stand (in his own measure: x to his left, z before him)
    const F = this.feet; let hipY = HIP - 0.006;
    for (let f = 0; f < 2; f++) {
      const ft = this.footAt(steps, tt, f, F[f]), du = (ft.u - o.u) / S, dz = (ft.out - o.out) / S;
      ft.x = du * cs - dz * sn; ft.z = du * sn + dz * cs; ft.ry = ft.yaw - psi; ft.y = ANKLE + ft.lift;
      const dh = Math.hypot(ft.x - (f === 0 ? HIPW : -HIPW), ft.z), top = ft.y + Math.sqrt(Math.max(0.01, 0.832 * 0.832 - dh * dh));
      if (ft.lift < 0.004) hipY = Math.min(hipY, top);
    }
    hipY = Math.max(HIP - 0.04, hipY) - 0.004 * o.going;
    const pos = L.floor(o.u, o.out, v.p);
    M.root.compose(pos.setY(L.y + 0.004), v.q.setFromEuler(v.e.set(0, L.yawOut + psi, 0)), v.s.setScalar(S));
    const set = (m, x, y, z, yaw, pitch, roll) => m.compose(v.tg.set(x, y, z), v.q.setFromEuler(v.e.set(pitch, yaw, roll)), v.s.setScalar(1));
    const sway = 0.012 * Math.sin(o.ph) * o.going - 0.026 * o.stand;
    set(M.pelvis, sway, hipY, 0, 0.06 * Math.sin(o.ph) * o.going - 0.3 * o.twist, 0, 0.05 * o.stand);
    M.a.copy(M.pelvis); set(M.b, 0, WAIST - HIP, 0, o.twist * 1.3, o.lean, o.side - 0.085 * o.stand); M.torso.multiplyMatrices(M.a, M.b);
    set(M.b, NECK[0], NECK[1] - WAIST, NECK[2], o.hy, o.hp, o.hr); M.head.multiplyMatrices(M.torso, M.b);
    const put = (i, m) => rig.mat(i, M.out.multiplyMatrices(M.root, m));
    put(I.pelvis, M.pelvis); put(I.torso, M.torso); put(I.head, M.head);
    // his legs
    for (let f = 0; f < 2; f++) {
      const ft = F[f], sg = f === 0 ? 1 : -1;
      v.hip.set(sg * HIPW, 0, 0).applyMatrix4(M.pelvis); v.ank.set(ft.x, ft.y, ft.z);
      v.pole.set(Math.sin(ft.ry * 0.6), 0, Math.cos(ft.ry * 0.6));
      reach(v.hip, v.ank, THIGH, SHIN, v.pole, v.knee, v.end);
      const heel = Math.min(0.5, 4 * v.end.distanceTo(v.ank)) * (ft.z < 0 ? 1 : -0.6);      // (a leg at full stretch: behind him the heel is up, before him the toe)
      put(I.thigh[f], hang(M.a, v.hip, v.knee, v.pole)); put(I.shin[f], hang(M.a, v.knee, v.end, v.pole));
      put(I.shoe[f], set(M.a, v.end.x, v.end.y, v.end.z, ft.ry, (ft.q > 0 ? 0.38 * Math.sin(TAU * ft.q) * (1 - 0.3 * ft.q) : 0) + heel, 0));
    }
    // his right arm: swinging as he walks; then the hand to his coat, thumb tucked in
    {
      v.sh.set(-SHO[0], SHO[1] - WAIST, SHO[2]).applyMatrix4(M.torso);
      const sw = 0.2 * Math.sin(o.ph) * o.going, k = o.hand, arc = Math.sin(PI * k);
      v.tg.set(-SHO[0] - 0.045, SHO[1] - WAIST - 0.535 + 0.03 * Math.abs(sw), 0.03 + 0.5 * sw).applyMatrix4(M.torso);
      v.tg2.set(-0.108, 0.045 + 0.004 * o.breath, 0.108).applyMatrix4(M.torso);
      v.wr.lerpVectors(v.tg, v.tg2, k); v.wr.addScaledVector(v.z.set(-0.3, 0, 1).transformDirection(M.torso), 0.09 * arc);
      v.pole.set(-0.25 - 0.75 * k, -0.2 * k, -1 + 0.72 * k).transformDirection(M.torso);
      reach(v.sh, v.wr, AU, AF, v.pole, v.el, v.end);
      put(I.armU, hang(M.a, v.sh, v.el, v.z.set(0, 0, 1).transformDirection(M.torso)));
      v.th.set(0, k, 1 - k).normalize().transformDirection(M.torso);
      put(I.armF, hang(M.a, v.el, v.end, v.th));
    }
    // ---- the shadows on the boards
    const bl = this.blobs, inRoom = sstep(o.out, 0.0, 0.14) * (vis ? 1 : 0); let n = 0;
    bl.set(n++, pos.x, pos.z, 0.2, 0.42 * inRoom);
    for (let f = 0; f < 2; f++) { L.floor(F[f].u, F[f].out, v.tg); bl.set(n++, v.tg.x, v.tg.z, 0.07, 0.6 * inRoom * (1 - clamp01(F[f].lift / (0.06 * 1)))); }
    L.floor((SILK.u0 + SILK.u1) / 2, 0.07, v.tg); bl.set(n++, v.tg.x, v.tg.z, 0.24, 0.4 * drop * drop);
    bl.count = n;
    // he is soft to the toy: it is moved aside, gently, and never held
    const toy = L.k.G.vehicle;
    if (vis && toy && dt > 0 && !L.quiet && toy.group && toy.group.visible && Math.abs(toy.pos.y - L.y) < 0.5) this.aside(L, toy, o.u, o.out, 0.11, dt);
    if (back && L.ret >= 1) this.hide();
  },
});
