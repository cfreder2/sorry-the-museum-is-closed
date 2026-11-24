// Claude Lorrain, View of Delphi with a Procession (1673), Gallery 209. The word: glow.
//
// Painted in Rome for Cardinal Camillo Massimi: the rock of Delphi with its round temple restored on the summit, a
// town of towers at its foot, a bridge, tall trees dark against the sky on the right, the sea pale in the distance
// between them, and across the meadow in front a small procession on its way up to the temple, a piper at its head.
// The museum's own word for it is the glow: "a delicate rendering of the glowing Mediterranean atmosphere". Nothing
// in a Claude hurries; the one thing that moves in it is the light. So the show is his light, arriving.
//
// Look at it and his view is brushed in under the picture, in his own smooth manner and built as he built a picture,
// in flats one behind another like the wings of a stage: a veil of his sky on the wall with the sea and the far hills
// a pale line at its foot, the rock dark against it, the tall trees a wing on the right, the bridge, and the meadow
// running out over the floor towards you as far as his band of light (beyond that is the dark of his foreground,
// where you stand). All of it is still in the cool of before the sun. A pipe begins, low. Then, on the phrase that
// climbs, the sun finds the highest thing there is, the dome of the temple, and it stands pale gold on the dark rock
// with a soft radiance behind it; the light comes down the cliffs and the towers, down through the trees, and runs
// out along the meadow, until the whole view glows as the picture does. After that it only breathes: the leaves
// stir, and now and then the shadow of one of his long clouds crosses it slowly. When you stop looking the light
// goes back the way it came, the meadow first, the temple last, and the view is taken up again under the frame.
//
// The outlines and the colours are measured from the picture (the skyline of the rock, where the trees' leaves are,
// and coarse tables of its colours, below); every touch is laid here. Three things are ours: the rock's left flank
// and the trees' right side, which the picture's edges cut, are rounded off a little way beyond them, so no flat
// ends in a straight cut; the temple is drawn a quarter larger than life, so it can be seen from the door; and the
// place in the meadow where the procession walks is bare grass.
//
// The pipe plays what was sung at Delphi: the First Delphic Hymn to Apollo (Athenaios, 128 BC), cut in stone on the
// Athenian treasury there for a procession like this one, found in 1893 and published that year (Weil and Reinach,
// Bulletin de Correspondance Hellénique 17). The second half of the first stanza, note for note as the stone has it
// (the one sign lost is left as a silence), in its five-time, unaccompanied, quietly, at a walking pace, a minor
// third under the conventional transcription (where its editors put its real pitch). The sun is on the dome by the
// top note of the phrase "who over the twin peaks of this rock of Parnassus": the hymn climbs there too. After the
// stanza, silence; if you stay, it is sung again.
//
// Nothing here is ever in front of a picture: the tallest thing, the big tree, stands 83 cm, close to the wall,
// under the rail of the frame and under the pictures hung on either side (the kit's guard is there for every camera,
// and from the checks' nine it has nothing to cut). Nothing is solid, and there is nothing to push. Two draw calls:
// the view (one mesh; its colours and its shapes are two textures, painted once, a step at a time between frames)
// and the light (the kit's pools: the low sun on the floor, his glow low on the wall, the radiance behind the dome).
// With "Reduce motion and flashing": the leaves and the cloud go at half speed, the light takes nearly twice as long
// to reach each thing, the radiance comes up more slowly, and the first note is eased in more slowly and lower.
//
// What it leaves out: nobody walks, because the procession is a rite of worship, with a child in it, people
// half-clothed in the antique way and a bull on its way to the altar, so no figure, no animal and none of the
// offerings is made or moved, and the temple is only painted, small on its rock, out of the toy's reach.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, rng } from '../paintlife.js';

const TAU = Math.PI * 2;
// The picture -> the room. x across the picture (0..1), y down it (0..1). What is above the foot of the rock stands
// up from the floor against the wall; what is below it (the meadow) lies on the floor, out towards you.
const SW = 1.84, SH = 1.4, HOR = 0.62;
const U = x => (x - 0.5) * SW, HT = y => (HOR - y) * SH;
const OUT0 = 0.24, OUT1 = 1.32;                      // the meadow: from here out to here (m from the wall)
const OUTY = y => OUT0 + (y - HOR) / (0.95 - HOR) * (OUT1 - OUT0);
// The top of the rock, across the picture (the hill itself; the temple stands on it).
const ROCK = [[-0.1, 0.63], [-0.078, 0.55], [-0.052, 0.47], [-0.026, 0.42], [0, 0.39], [0.045, 0.385], [0.065, 0.367], [0.08, 0.335], [0.095, 0.32], [0.125, 0.287], [0.165, 0.262], [0.205, 0.236], [0.228, 0.214], [0.268, 0.214], [0.35, 0.222], [0.372, 0.232], [0.41, 0.244], [0.422, 0.272], [0.432, 0.328], [0.452, 0.362], [0.47, 0.396], [0.497, 0.443], [0.52, 0.482], [0.532, 0.54], [0.542, 0.6], [0.58, 0.618]];
const rockTop = x => { for (let i = 1; i < ROCK.length; i++) if (x <= ROCK[i][0]) { const a = ROCK[i - 1], b = ROCK[i]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } return 0.62; };
const TEMPLE = { x: 0.308, y: 0.222, k: 1.25 };      // the round temple: where it stands, and a little larger than life
// Measured from the picture: its colours in coarse tables (rows of r g b, base64), each over its own part of it; and
// where the trees' leaves are (48 x 72 cells over the right of the picture, two bits each: none, thin, most, full).
const PIC = {
  rock: [20, 14, 'WlxUWlxUWlxUWlxUU1hOU1hOU1hOU1hOVFdMdnNidnNifntqfntqfntqZ2ZWZ2ZWYWFUYWFUW1xQW1xQWlxUWlxUWlxUWlxUQUhCU1hOU1hOU1hOVFdMdnNidnNifntqfntqZ2ZWZ2ZWYWFUYWFUW1xQW1xQW1xQTlJJWlxUWlxUWlxUWlxUQUhCU1hOU1hOVFdMV1lLZmVSbWtZZ2ZWZ2ZWYWFUYWFUW1xQW1xQW1xQW1xQTlJJTlJJWlxUWlxUWlxUQUhCQUhCPEI8OkE6P0M6TE5AT1JDXFxNYWFUYWFUW1xQW1xQW1xQW1xQX2BTS1FKTlJJTlJJWlxUWlxUTFBJOTw1ODs0Oj0zOj0zQEM2QUQ5TE5DVFRHW1xQW1xQW1xQX2BTX2BTX2BTS09DS1FKTlJJTlJJR0tBQEM5MjUsMjQpNTgtNTktPUAxPUA0Q0Y6UlJCWFpNWFpNX2BTX2BTX2BTX2BTS09DS1FKS1FKP0M6NTcuNTcuMjQsLC4mLC0lLi8oQ0EwOz0wOj80UFFAXFxNX2BTX2BTX2BTWVtOWVtOS09DP0Q8PEA3NTcsMDEpMjQrLjApLC4lLi8kLC0mPj0uP0AyPEA0Tk48bWZRWFlMWFlMWVtOWVtOXWFVMDUtMzYuNTctNzkuOTgrSEAuNzUoLjAnLzEmLzEoMjQrPT4vQkM0Tk06W1dDXVxMWVtOWVtOXWFVXWFVMjMoPDsuOzksNjgtNzQnUEYxQD8wNDgsMTUsMjUsLTApMDIoMTcuOz80Q0U5VVRETlBEXWFVXWFVXWFVNDQoOjosPDstNzYqOjcpSEEuQj4vMzQqPTwtMjQoMTMpMTQrMjcuNToxPD40RUY6SEpAUlVKUlVKUlVKMTMoMTInLzAmQTopOTYoODUnRUIyMjQoRD8sMjImMjImNTYpNjktODswP0AySEk6TE1AU1VKU1VKZGFSKSohKisjKSohPTUlLy8kMjAkOjgpMzQnOTkqPDgnQDwrOTcoNTcrOjsuNjgtREU2SEk8VlVJZGFSZGFSKSwkKCojJygiMjAkKSohLCshMzIjLS0hKywhMjImMDElMjMlMTQmNTgqMjQpNjgtPT80UVJDY19OY19O'],
  tree: [12, 18, 'O0Q3O0Q3O0Q3OkM2V11NV11NOUE0OUU4OUU4OUU4QUo9QUo9Qko9O0Q3O0Q3OkM2V11NV11NOUE0OUU4OUU4QUo9QUo9T1dIQko9Qko9MjouKzMqNj4yTVNFMzovMTovQUo9QUo9T1dIT1dISlFDSlFDMjctJyslJy4nKzEoJy4nKS8oOUAzT1dIT1dIP0c4SlFDSlFDRko6KS0mJCkjIykkIigjIygiJy0kLTQqP0c4P0c4TlVJTlVJMjctJyojKSwlIychIiYhIichJCkjKTAoOUI1OUI1SlRKSlRKOT81NTkvKy8nIyYhIyYfISYgIichJSskO0I3O0I3SlRKSlRKTFFGTVFDMDQqJyskJikiJCkiLDAoMTYrOkA0OkA0SlRKTFFGTFFGTVFDP0M1RUo9REk9P0Q5LDAnQUY4ZGRMY1s9TFFGTFFGTFFGVllKVllKWF1NW2BQS08/MjUsLDIpYFk4R0ErTFFGTFFGVllKVllKVllKWF1NW2BQSUkzMDImOTwvTEkyQDwoTFFGVllKVllKVllKcmpNWlc9Wlc9Pz8rRkQuLS8kRUYzODYmVllKcmpNcmpNcmpNcmpNcmpNTEo0LC0iMTAhKywiMTMnKisjcmpNcmpNcmpNcmpNcmpNcmpNWlU8NTUmNjUlMDEmJighJSchcmpNcmpNcmpNcmpNc2lHc2lHc2lHPjwoLy4hJicgJCYgJSYgcmpNcmpNc2lHc2lHc2lHc2lHc2lHbGNCQj4pKishJCYhJCUgc2lHc2lHc2lHc2lHc2lHc2lHbGNCbGNCU041OTgnJighJSYgc2lHc2lHc2lHc2lHc2lHbGNCSkk4Skk4Skk4NjcrJCYhJigi'],
  sky: [12, 8, 'bozKdZPPe5bNf5jKh6DRkqjQqbbKpLPKmanBoK7AnK7HorbQfpbGhpzIjqHElaW9m6i9narBnqm6mqS1manBoK7AnK7HorbPkKLEjZ/AkaG+laGykqC4mafBnq3HpbLGpbLGqLjUtcPQtcPQlqfElafIkaG+laGykqC4lKrVmK7WnLDTqLjUqLjUtcPQtcPQoa3AlafIlafIlaGyprfVprfVrLvVrLzasL/bw8nTw8nTtcPQoa3Aoa3AlafIprfVprfVprfVssDbtcTgtcHYtsDRtsDRtsDRoa3Aoa3Aoa3AprfVxM3ixM3ixM3ixc7kyNDly8/by8/by8/boa3Aoa3Aoa3AxsvZxsvZxsvZxsvZwsfXwsnawcnZwcnZwcnZ'],
  meadow: [16, 8, 'KisjLS4kMDAkMTIkMjMlMjMlNDYoNDgtQUU6aHFxaHFxaHFxaHFxWmFXQEU9JigiMTMmMjMmMjMmMjMmMjMmMzUnMzUnMzYpOD0yOT0yPz0yPz0uPzwpJigiJigiJighISIdISMdISMdIiMdLS4kNTcpNTcpNTcpNjgpNTcoMTIoLzImJigiJigiJighJScfHyEcICIcISMcIiMcIiMdIyQdKCkhKCohKishKywiMC8iMDIjMDIjMDIjLzAjLS4iHiEdHyIdICIdISIdKisfKywhKy0hLzAiLzAkMDIlNTYlPzolPzolPzolOzglNDQkNTckOTklPTslPTskQj4lRD8mRD8mREMpREMpRUMpREEnQD0mPzwmPzwmPDsmODklKykaKikcKSkdKSkdKykdLCweRkEkRkEkRkEkQzwjNzcjNzUjNTUjNDUjNTYkNDUjHyAYISIZIiMZLzAeREAmXE8rXE8rXE8rQDwkNzUjMTEjLi4hKSshKSsgKSsgKSog'],
  leaves: [48, 72, 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADA+gEA0G8AAAAAAADg/w8A9L8BAAAAAAD0/y8B/P8HAAAAAAD4/78K/f8LAAAAAID5//8f//9vAAAAAOD///+/////AQAAAPT/////////BwAAAPj/////////CwAAAPT/////////CwAAAPT/////////CwAAAPD/////////WwAAAND//////////woAAED//////////x8AAAD9/////////x8AAAD0/////////x8AAAD1/////////+8BAID///////////8DAPT///////////8LAPj///////////8HAPD///////////8DAPT///////////8CAPj//////////28AAPT+7////////18BAAD+3/////////8LAED/3/////////8LAEC/+/////////8HAACo9v////////8DAAAA9P///////28AAAAA9P///////w8AAAAAoP7//////x+UAAAAAP///////5//AAAAwP////3/////AAAAwP//v/7/n/7/AAAAQP/3P/j/D/z/AAAAAPv2A6n/C/7/AAAAAJFQQV//R///AAAAAAAA0P//w///AAAAAAAA4P//y///AAAAAAAA4P//7///AAAAAAAA8P//////AAAAAAAA8P//////AAAAAABA////////AAAAAACA////////AAAAAADk////////AAAAAAD4////////AAAAAAD0////////AAAAAADw////////AAAAAAD0////////AAAAAAD0////////AAAAAACQ7///////AAAAAAAA1f//////AAAAAAAA8P//////AAAAAADg+P//////AAAAAADw/f//////AAAAAAC4////////AAAAAACk////////AAAAAABA////////AAAAAAAA4P//////AAAAAAAA0K/+////AAAAAAAAAMn/////AAAAAAAAAMD/////AAAAAAAAAED9////AAAAAAAAAAD4/v//AAAAAAAAAAD9////AAAAAAAAEAD4////AAAAAAAAoFr1////AAAAUFXQ+///////pAbQ+yv4v+L/////'],
};
// The view's five flats in one texture: where each is in it (pixels), and the part of the picture each shows.
const AW = 2048, AH = 1024, TEX = 0.75;      // (laid out at this size, painted at three quarters of it)
const REG = { rock: [8, 8, 890, 520], tree: [906, 8, 588, 600], sky: [1502, 8, 536, 316], bridge: [1502, 344, 300, 72], mead: [8, 632, 1280, 380] };
// (the rock and the trees run off the picture's edges: each is rounded off a little way beyond, so no flat ends in a cut)
const WIN = { rock: [-0.1, 0.58, 0.12, 0.62], tree: [0.6, 1.07, 0, 0.62], sky: [0, 1, 0, 0.62], mead: [-0.12, 1.12, 0.62, 0.95] };

// ---------------------------------------------------------------- the hymn
// Athenaios, Paean to Apollo (the First Delphic Hymn), first stanza, from "sing of the golden-haired" to its end
// (bars 12 to 28), at the conventional pitch (the central note, mese, is C): 'note:quavers' (1 left out; R a silence).
// Five quavers to the bar. Checked note by note against Pöhlmann and West's reading of the stone (Documents of
// Ancient Greek Music, 2001) as Barnaby Brown and Armand D'Angour give it in their performing edition (2017), and
// against the stone's letters (Θ Eb, Ι D, Μ C, Υ Ab, Φ G, F low Eb, Γ F, ℧ G above, the sign over it Ab above, Λ Db).
// Only what the stone has: the one note the editors supply (the first of bar 19) is left silent. The two short
// breaths are the edition's, at the ends of "golden-haired" and "he comes".
const HYMN = 'Eb4:2 Eb4 G4:2 | G4 Ab4 Ab4 Eb4:1.5 R:0.5 | Eb5 Eb5 Eb5 G5 Ab5 | G5:2 Eb5 G5:2 | G5:2 G5 Eb5:2 | Eb5 C5 C5 Eb5 Eb5 | D5:2 D5 C5 Ab4 | ' +
  'R Ab4 C5 C5 Ab4 | C5 D5 Eb5 D5 Eb5 | F5:2 G5 Ab5 F5 | F5 G5 Ab5 G5:2 | G5:2 Eb5 F5 F5 | F5:2 Db5 Db5:1.5 R:0.5 | C5:2 C5 C5 C5 | C5 Ab4 Ab4 C5 D5 | Eb5 D5 C5 C5 C5 | G4:2 G4 G4:2';
const QUAVER = 0.31, T_HYMN = 0.5, DOWN = -3;       // seconds to a quaver; when it begins; semitones under the transcription
const SUNG = (() => {
  const K = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }, out = []; let at = 0;
  for (const tok of HYMN.split(/\s+/)) {
    if (tok === '|') continue;
    const [n, len = '1'] = tok.split(':'), d = +len, m = /^([A-G])(b|#)?(\d)$/.exec(n);
    if (m) out.push({ t: at * QUAVER, d: d * QUAVER, f: 440 * Math.pow(2, (K[m[1]] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0) + 12 * (+m[3] + 1) - 69 + DOWN) / 12) });
    at += d;
  }
  out[out.length - 1].last = true; out.len = at * QUAVER;
  return out;
})();
const STANZA = SUNG.len, AGAIN = STANZA + 9;        // and the silence before it is sung again
const T_PEAK = T_HYMN + 14 * QUAVER;                 // the top note of bar 14: the sun on the dome

lifeFor(43145, {
  title: /^View of Delphi/,
  word: 'glow',
  // (low and near: the rock and the trees stand under the picture, the meadow runs out towards you)
  stage: { out: OUT1, half: 1.3, cam: { dist: 2.7, height: 0.7, side: 0.28, fov: 58, lookU: 0, lookOut: 0.45, lookH: 0.8, floorOut: 1.15 } },
  wake: 2, ret: 3,

  build(L) {
    // ---------------------------------------------------------- the flats: one mesh, drawn from the wall outwards
    const pos = [], uv = [], aP = [], aQ = [], idx = [];
    // A flat: gw x gh squares over its part of the texture; at(s, t) (s across, t down, 0..1) gives where each corner
    // stands { u, h, out } (h: above the floor) and its times { t0 (brushed in),
    // sun (the sun reaches it), gone (taken up again, 0..1 of the return), deep (how dark it is before the sun, 0..1),
    // sway (m), cloud (0..1: a cloud's shadow shows on it), gain (how bright it stands in the sun, of the picture's own) }.
    const flat = (reg, gw, gh, at) => {
      const base = pos.length / 3, p = new THREE.Vector3();
      for (let j = 0; j <= gh; j++) for (let i = 0; i <= gw; i++) {
        const s = i / gw, t = j / gh, o = at(s, t);
        L.floor(o.u, o.out, p);
        pos.push(p.x, L.y + o.h, p.z); uv.push((reg[0] + s * reg[2]) / AW, (reg[1] + t * reg[3]) / AH);
        aP.push(o.t0, o.sun, o.gone, o.deep == null ? 1 : o.deep); aQ.push(o.sway || 0, o.cloud == null ? 1 : o.cloud, (s * 3.1 + t * 1.7) % 1, o.gain || 1);
      }
      for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { const a = base + j * (gw + 1) + i, b = a + 1, c = a + gw + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    };
    const skyTop = HT(0), rockH = HT(0.14), treeH = HT(0);
    // the sky: on the wall. It warms from the horizon up, before the sun shows.
    flat(REG.sky, 8, 4, (s, t) => { const h = HT(0.62 * t); return { u: U(s), h, out: 0.004, t0: 0.05 + 0.6 * h / skyTop, sun: 0.9 + 2.9 * h / skyTop, gone: 0.56 - 0.22 * h / skyTop, deep: 0.3, cloud: 0, gain: 1.06 + 0.22 * t * t }; });
    // the meadow: on the floor. The sun runs out along it last.
    flat(REG.mead, 10, 6, (s, t) => { const o = OUT0 + (OUT1 - OUT0) * t; return { u: U(-0.12 + 1.24 * s), h: 0.014, out: o, t0: 0.35 + 1.3 * t, sun: T_PEAK + 1.45 + 1.05 * t, gone: 0.04 + 0.34 * (1 - t), deep: 0.8, gain: 1.12 }; });
    // the rock: a shell that swells out from the wall towards its foot, so it has a flank from the side
    flat(REG.rock, 14, 8, (s, t) => {
      const h = HT(0.12 + 0.5 * t), bulge = Math.pow(Math.sin(Math.PI * clamp01(0.04 + s * 0.94)), 0.7) * (0.18 + 0.82 * t);
      return { u: U(-0.1 + 0.68 * s), h, out: 0.03 + 0.2 * bulge, t0: 0.35 + 1.0 * h / rockH, sun: T_PEAK - 0.8 + 2.35 * (1 - clamp01(h / HT(0.165))) + 0.3 * s, gone: 0.5 - 0.32 * h / rockH };
    });
    // the trees: a wing, bowed a little into the room; the crowns stir
    flat(REG.tree, 8, 10, (s, t) => {
      const h = HT(0.62 * t), top = 1 - t;
      return { u: U(0.6 + 0.47 * s), h, out: 0.17 + 0.07 * Math.sin(Math.PI * s) + 0.03 * top, t0: 0.5 + 1.1 * h / treeH, sun: T_PEAK + 0.65 + 1.25 * (1 - h / treeH), gone: 0.5 - 0.32 * h / treeH, deep: 0.8, sway: 0.007 * Math.pow(top, 1.3) };
    });
    // the bridge: a low wall of arches standing in the meadow on the left, where the bright band ends
    { const o = OUTY(0.775), h1 = 0.095;
      flat(REG.bridge, 1, 1, (s, t) => ({ u: U(0.085 + 0.235 * s), h: h1 * (1 - t) + 0.012, out: o, t0: 1.25, sun: T_PEAK + 1.9, gone: 0.3 })); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('aP', new THREE.Float32BufferAttribute(aP, 4)); geo.setAttribute('aQ', new THREE.Float32BufferAttribute(aQ, 4)); geo.setIndex(idx);

    const u = this.u = { uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uO: { value: L.floor(0, 0) }, uShow: { value: 0 }, uGone: { value: 0 }, uSun: { value: 0 }, uSlow: { value: 0.85 }, uStir: { value: 0 }, uCloud: { value: new THREE.Vector2(-9, 0) }, uWarm: { value: new THREE.Vector3(1.06, 1.0, 0.92) }, tShape: { value: null } };
    const [colours, shapes] = this.paint(L); u.tShape.value = shapes;
    const sm = this.smat = new THREE.MeshBasicMaterial({ map: colours, color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
    sm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec4 aP, aQ; uniform vec4 uAx; uniform float uStir; varying vec4 vP; varying vec3 vQ, vWp;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  { float w = uStir * (0.8 + 0.5 * aQ.z), sw = sin(w + aQ.z * 6.283) + 0.5 * sin(w * 2.3 + aQ.z * 17.0);
    transformed.xz += uAx.xy * sw * aQ.x; transformed.y += 0.35 * aQ.x * sin(w * 1.3 + aQ.z * 9.0); }
  vP = aP; vQ = aQ.xyw; vWp = transformed;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform sampler2D tShape; uniform vec4 uAx; uniform vec3 uO, uWarm; uniform vec2 uCloud; uniform float uShow, uGone, uSun, uSlow;
varying vec4 vP; varying vec3 vQ, vWp;
float dHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float dNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(dHash(i), dHash(i + vec2(1.0, 0.0)), f.x), mix(dHash(i + vec2(0.0, 1.0)), dHash(i + vec2(1.0, 1.0)), f.x), f.y); }`)
        .replace('#include <color_fragment>', `{
  float su = dot(vWp.xz - uO.xz, uAx.xy), so = dot(vWp.xz - uO.xz, uAx.zw);
  float n = dNoise(vec2(su * 9.0 + so * 3.0, (vWp.y - uO.y) * 16.0 + so * 12.0)) - 0.5;      // (so no edge of light or of paint is ruled)
  // before the sun: darker, greyer, towards the blue of his shade
  vec3 c = diffuseColor.rgb; float l = dot(c, vec3(0.3, 0.55, 0.15));
  vec3 sh = mix(vec3(l), c, 0.55) * mix(vec3(1.0), vec3(0.68, 0.75, 0.88) / (1.0 + 1.5 * l), vP.w);
  float lit = smoothstep(vP.y, vP.y + uSlow, uSun + n * 0.35);
  float cq = (su + 0.4 * so - uCloud.x) / 0.55; lit *= 1.0 - 0.6 * uCloud.y * vQ.y * exp(-cq * cq);      // a cloud's shadow, crossing
  diffuseColor.rgb = mix(sh, c * uWarm * vQ.z, lit);
  // brushed in, and taken up again
  diffuseColor.a = texture2D(tShape, vMapUv).r * smoothstep(vP.x, vP.x + 0.45, uShow + n * 0.3) * (1.0 - smoothstep(vP.z, vP.z + 0.25, uGone + n * 0.12));
  if (diffuseColor.a < 0.004) discard;
}`);
    };
    sm.customProgramCacheKey = () => 'delphi-view';
    const view = this.view = new THREE.Mesh(geo, sm); view.name = 'view'; view.renderOrder = 6;
    L.add(view);
    { const fl = L.k.museum.floors; if (fl && !fl.includes(view)) fl.push(view); }      // (not drawn into the polished floor's reflection: the meadow lies on it; shown and hidden by its material)

    // ---- the light itself: the low sun on the floor, in two warm pools along his bright band
    const gold = L.pal.near('#ffcf86', 0.05);
    this.sun = L.glows([
      { u: -0.1, out: OUTY(0.88), w: 2.2, d: 0.7, color: gold, strength: 0.1 },
      { u: -0.15, out: OUTY(0.96), w: 1.5, d: 0.5, color: gold, strength: 0.07 },
      // (and his glow low in the sky, on the wall behind everything)
      { wall: true, u: U(0.62), v: 0.2 - (L.cy - L.y), w: 1.7, d: 0.9, color: L.pal.near('#fff2d0', 0.05), strength: 0.3 },
      // (and the radiance round the temple when the sun finds it)
      { wall: true, u: U(TEMPLE.x), v: HT(0.185) - (L.cy - L.y), w: 0.62, d: 0.5, color: L.pal.near('#ffe2a0', 0.05), strength: 0.55 },
    ]);
    this.sun.renderOrder = 5;
    this.clock = 0; this.ts = 0; this.sunT = 0; this.mu = 0;
    this.hide();
  },

  // ---------------------------------------------------------------- the view, painted once
  // Two canvases, the colours and the shapes (so that no dark fringe is left where a leaf ends), a texture each. The
  // colours come from the picture's own tables; every touch is laid here in his manner: the sky in
  // long level veils, the rock in soft dabs and the bare cliff in upright strokes, the trees leaf by leaf with the
  // light on their upper left, the meadow in level strokes.
  paint(L) {
    const steps = [], r = rng(431450), mk = () => { const c = document.createElement('canvas'); c.width = AW * TEX; c.height = AH * TEX; return c; };
    const cc = mk(), ca = mk(), g = cc.getContext('2d'), a = ca.getContext('2d');
    g.scale(TEX, TEX); a.scale(TEX, TEX);
    g.fillStyle = '#3a3b2c'; g.fillRect(0, 0, AW, AH); a.fillStyle = '#000'; a.fillRect(0, 0, AW, AH);
    const b64 = s => Uint8Array.from(atob(s), ch => ch.charCodeAt(0));
    // A table of the picture's colours, smoothed: f(x, y, into) for x, y in 0..1 of its own part of the picture.
    const table = ([gw, gh, s]) => { const d = b64(s); return (x, y, o) => {
      const fx = Math.max(0, Math.min(gw - 1.001, x * gw - 0.5)), fy = Math.max(0, Math.min(gh - 1.001, y * gh - 0.5)), i = Math.floor(fx), j = Math.floor(fy), kx = fx - i, ky = fy - j;
      for (let c = 0; c < 3; c++) { const p = (jj, ii) => d[(jj * gw + ii) * 3 + c]; o[c] = (p(j, i) * (1 - kx) + p(j, i + 1) * kx) * (1 - ky) + (p(j + 1, i) * (1 - kx) + p(j + 1, i + 1) * kx) * ky; }
      return o; }; };
    const leavesAt = (() => { const [gw, gh, s] = PIC.leaves, d = b64(s), lv = [0, 0.3, 0.65, 1], v = (j, i) => lv[(d[(j * gw + i) >> 2] >> (((j * gw + i) & 3) * 2)) & 3];
      return (x, y) => { if (y > 0.955 && x < 0.64) return 0;      // (the far shore, not a tree)
        const fx = Math.max(0, Math.min(gw - 1.001, x * gw - 0.5)), fy = Math.max(0, Math.min(gh - 1.001, y * gh - 0.5)), i = Math.floor(fx), j = Math.floor(fy), kx = fx - i, ky = fy - j;
        return (v(j, i) * (1 - kx) + v(j, i + 1) * kx) * (1 - ky) + (v(j + 1, i) * (1 - kx) + v(j + 1, i + 1) * kx) * ky; }; })();
    const rgb = (c, k = 1, wr = 1, wb = 1) => `rgb(${Math.round(Math.min(255, c[0] * k * wr))},${Math.round(Math.min(255, c[1] * k))},${Math.round(Math.min(255, c[2] * k * wb))})`;
    const dab = (ctx, x, y, rx, ry, rot, style, al = 1) => { ctx.globalAlpha = al; ctx.fillStyle = style; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fill(); };
    // A soft touch: three ellipses one inside another, so it has no edge.
    const soft = (ctx, x, y, rx, ry, rot, style, al = 1) => { for (const [k, q] of [[1, 0.3], [0.72, 0.42], [0.42, 0.55]]) dab(ctx, x, y, rx * k, ry * k, rot, style, al * q); };
    const tmp = [0, 0, 0];
    // One flat's place in the texture: X(x), Y(y) for a point of the picture; both canvases kept to it.
    const open = (reg, win, pad = 6) => {
      for (const [ctx, p] of [[g, pad], [a, -1]]) { ctx.save(); ctx.beginPath(); ctx.rect(reg[0] - p, reg[1] - p, reg[2] + 2 * p, reg[3] + 2 * p); ctx.clip(); }
      return { X: x => reg[0] + (x - win[0]) / (win[1] - win[0]) * reg[2], Y: y => reg[1] + (y - win[2]) / (win[3] - win[2]) * reg[3], fx: x => (x - win[0]) / (win[1] - win[0]), fy: y => (y - win[2]) / (win[3] - win[2]) };
    };
    // (and a clean dark rim round its shape: where a canvas keeps to a rectangle its edge is soft, and a soft edge
    // lets a hair of what was painted first show through what was painted over it)
    const rim = ([x, y, w, h]) => { a.globalAlpha = 1; a.fillStyle = '#000'; a.fillRect(x - 5, y - 5, w + 10, 7.5); a.fillRect(x - 5, y + h - 2.5, w + 10, 7.5); a.fillRect(x - 5, y - 5, 7.5, h + 10); a.fillRect(x + w - 2.5, y - 5, 7.5, h + 10); };
    const shut = reg => { g.globalAlpha = 1; a.globalAlpha = 1; g.restore(); a.restore(); rim(reg); };
    // The ground of a flat: the table's colours, laid in blocks under the touches.
    const ground = (reg, f, fxOf = s => s, step = 10) => { g.globalAlpha = 1; for (let y = -step; y < reg[3] + step; y += step) for (let x = -step; x < reg[2] + step; x += step) { f(clamp01(fxOf((x + step / 2) / reg[2])), clamp01((y + step / 2) / reg[3]), tmp); g.fillStyle = rgb(tmp); g.fillRect(reg[0] + x, reg[1] + y, step + 1, step + 1); } };

    // ---------------------------------------------------------- the sky, with the sea and the far hills at its foot
    steps.push(() => {
      const reg = REG.sky, M = open(reg, WIN.sky), f = table(PIC.sky);
      ground(reg, f, s => s, 8);
      for (let i = 0; i < 340; i++) { const x = r(), y = r() * 0.62; f(x, y / 0.62, tmp); soft(g, M.X(x), M.Y(y), 26 + r() * 60, 3 + r() * 6, (r() - 0.5) * 0.05, rgb(tmp, 0.975 + 0.06 * r()), 0.5); }
      // his long level clouds, lit from under
      for (const [x, y, len, k] of [[0.27, 0.1, 0.5, 1], [0.56, 0.04, 0.34, 0.9], [0.1, 0.17, 0.24, 0.8], [0.53, 0.33, 0.17, 1], [0.62, 0.365, 0.12, 0.8], [0.57, 0.5, 0.12, 0.6], [0.5, 0.225, 0.2, 0.5]])
        for (let i = 0; i < 9; i++) soft(g, M.X(x + (r() - 0.5) * len * 0.6), M.Y(y + (r() - 0.5) * 0.022), len * reg[2] * (0.16 + 0.22 * r()), 2 + r() * 3, (r() - 0.5) * 0.04, 'rgb(234,229,218)', 0.24 * k);
      // the pale glow low in it; the far hills, the sea, the far shore
      for (let i = 0; i < 70; i++) soft(g, M.X(0.3 + 0.65 * r()), M.Y(0.45 + 0.15 * r()), 40 + r() * 70, 4 + r() * 7, 0, 'rgb(233,228,214)', 0.2);
      g.globalAlpha = 0.85; g.fillStyle = 'rgb(152,168,202)'; g.beginPath(); g.moveTo(M.X(0.66), M.Y(0.593));
      for (const [x, y] of [[0.7, 0.585], [0.74, 0.576], [0.775, 0.569], [0.8, 0.573], [0.83, 0.563], [0.86, 0.571], [0.9, 0.586], [0.9, 0.6], [0.66, 0.6]]) g.lineTo(M.X(x), M.Y(y)); g.fill();
      for (let i = 0; i < 70; i++) { const x = 0.48 + 0.46 * r(), y = 0.59 + 0.024 * r(); soft(g, M.X(x), M.Y(y), 14 + r() * 26, 1.3 + r() * 1.6, 0, y > 0.606 ? 'rgb(186,190,178)' : r() < 0.3 ? 'rgb(190,202,222)' : 'rgb(160,176,208)', 0.8); }
      // its shape: whole at the horizon, thinning away upwards and to either side, in level streaks
      a.globalAlpha = 1;
      const gv = a.createLinearGradient(0, M.Y(0.03), 0, M.Y(0.62)); gv.addColorStop(0, 'rgba(255,255,255,0)'); gv.addColorStop(0.3, 'rgba(255,255,255,0.22)'); gv.addColorStop(0.58, 'rgba(255,255,255,0.74)'); gv.addColorStop(0.8, 'rgba(255,255,255,0.95)'); gv.addColorStop(1, 'rgba(255,255,255,0.97)');
      a.fillStyle = gv; a.fillRect(reg[0], reg[1], reg[2], reg[3]);
      for (let i = 0; i < 90; i++) { const x = 0.25 + 0.6 * r(), y = 0.12 + r() * 0.36; soft(a, M.X(x), M.Y(y), 30 + r() * 60, 3 + r() * 6, 0, r() < 0.5 ? '#000' : '#fff', 0.07); }
      for (const [x0, x1] of [[0, 0.3], [1, 0.8]]) { const gh = a.createLinearGradient(M.X(x0), 0, M.X(x1), 0); gh.addColorStop(0, 'rgba(0,0,0,1)'); gh.addColorStop(0.25, 'rgba(0,0,0,0.8)'); gh.addColorStop(1, 'rgba(0,0,0,0)'); a.globalAlpha = 1; a.fillStyle = gh; a.fillRect(reg[0], reg[1], reg[2], reg[3]); }
      { const gt = a.createLinearGradient(0, M.Y(0), 0, M.Y(0.1)); gt.addColorStop(0, 'rgba(0,0,0,1)'); gt.addColorStop(1, 'rgba(0,0,0,0)'); a.fillStyle = gt; a.fillRect(reg[0], reg[1], reg[2], reg[3]); }
      shut(reg);
    });

    // ---------------------------------------------------------- the rock, the temple on it, the town at its foot
    {
      const reg = REG.rock, win = WIN.rock, f = table(PIC.rock), at = (x, y, o) => f(x / 0.58, (y - 0.14) / 0.48, o); let M;
      steps.push(() => { M = open(reg, win);
      ground(reg, f, s => (-0.1 + 0.68 * s) / 0.58);
      // the broad modelling, soft; then the small touches: round for its woods, upright for the bare cliff
      for (let i = 0; i < 600; i++) { const x = -0.1 + r() * 0.68, y = 0.14 + r() * 0.48; at(x, y, tmp); soft(g, M.X(x), M.Y(y), 10 + r() * 14, 8 + r() * 12, r() * 3, rgb(tmp, 0.9 + 0.2 * r()), 0.6); }
      for (let i = 0; i < 4800; i++) {
        const x = -0.1 + r() * 0.68, y = 0.14 + r() * 0.48; if (y < rockTop(x) - 0.03) continue;
        at(x, y, tmp); const lum = 0.3 * tmp[0] + 0.55 * tmp[1] + 0.15 * tmp[2], bare = lum > 70 && tmp[0] > tmp[2] + 13 && y > rockTop(x) + 0.03, q = r();
        if (bare) dab(g, M.X(x), M.Y(y), 1.6 + r() * 2, 5 + r() * 10, (r() - 0.5) * 0.35, rgb(tmp, q < 0.22 ? 1.2 + 0.2 * r() : q < 0.45 ? 0.8 : 0.92 + 0.16 * r(), q < 0.22 ? 1.05 : 1), 0.55);
        else dab(g, M.X(x), M.Y(y), 2 + r() * 3.4, 1.6 + r() * 2.6, r() * 3, rgb(tmp, q < 0.14 ? 1.16 + 0.14 * r() : q < 0.34 ? 0.78 + 0.1 * r() : 0.9 + 0.2 * r(), q < 0.14 ? 1.04 : 1), 0.55);
      }
      shut(reg); });
      steps.push(() => { M = open(reg, win);
      // its shape: the hill, its skyline broken by the trees that grow along it (the cliff side cleaner)
      a.globalAlpha = 1; a.fillStyle = '#fff'; a.beginPath(); a.moveTo(M.X(-0.1), M.Y(0.62) + 4);
      for (const [x, y] of ROCK) a.lineTo(M.X(x), M.Y(y)); a.lineTo(M.X(0.58), M.Y(0.62) + 4); a.fill();
      for (let i = 0; i < 1050; i++) { const x = -0.09 + r() * 0.655, wooded = x < 0.41, y = rockTop(x) + (r() - 0.55) * (wooded ? 0.014 : 0.005), s = wooded ? 1.6 + r() * 3.2 : 1.2 + r() * 2; dab(a, M.X(x), M.Y(y), s * 1.25, s, r() * 3, r() < 0.3 ? '#000' : '#fff', 1); }

      // ---- the town: brick and stone in the shade of the rock, a little light on their left sides
      const wall = (x0, x1, y0, y1, k, arches = 0, round = false) => {
        const X0 = M.X(x0), X1 = M.X(x1), Y0 = M.Y(y0), Y1 = M.Y(y1), w = X1 - X0;
        at((x0 + x1) / 2, (y0 + y1) / 2, tmp); const gr = g.createLinearGradient(X0, 0, X1, 0);
        if (round) { gr.addColorStop(0, rgb(tmp, k * 1.05, 1.1, 0.92)); gr.addColorStop(0.28, rgb(tmp, k * 1.22, 1.12, 0.88)); gr.addColorStop(0.62, rgb(tmp, k * 0.9, 1.06)); gr.addColorStop(1, rgb(tmp, k * 0.62)); }
        else { gr.addColorStop(0, rgb(tmp, k * 1.12, 1.08, 0.92)); gr.addColorStop(1, rgb(tmp, k * 0.84, 1.04)); }
        g.globalAlpha = 0.9; g.fillStyle = gr; g.beginPath(); g.moveTo(X0, Y1); g.lineTo(X0, Y0 + r() * 4);
        for (let i = 1; i <= 6; i++) g.lineTo(X0 + w * i / 6, Y0 + (r() - 0.3) * 5); g.lineTo(X1, Y1); g.fill();      // (a ruined top)
        for (let i = 0; i < arches; i++) { const cx = X0 + w * (i + 0.5) / arches, aw = w / arches * 0.28, top = Y0 + (Y1 - Y0) * 0.45; g.globalAlpha = 0.85; g.fillStyle = rgb(tmp, k * 0.5); g.beginPath(); g.moveTo(cx - aw, Y1); g.lineTo(cx - aw, top); g.arc(cx, top, aw, Math.PI, 0); g.lineTo(cx + aw, Y1); g.fill(); }
        for (let i = 0; i < w * (Y1 - Y0) / 40; i++) { const x = X0 + r() * w, y = Y0 + 4 + r() * (Y1 - Y0 - 4); dab(g, x, y, 2 + r() * 3, 1 + r() * 1.5, 0, rgb(tmp, k * (0.82 + 0.34 * r()) * (round ? 1.15 - 0.5 * (x - X0) / w : 1), 1.06), 0.4); }
      };
      wall(0.018, 0.062, 0.452, 0.612, 1.0, 1); wall(0.06, 0.112, 0.44, 0.612, 1.1, 2); wall(0.185, 0.215, 0.492, 0.612, 1.0, 1);
      wall(0.214, 0.262, 0.515, 0.612, 1.1, 2); wall(0.262, 0.286, 0.47, 0.612, 1.05); wall(0.286, 0.336, 0.548, 0.612, 1.0, 2);
      wall(0.118, 0.183, 0.42, 0.612, 1.18, 0, true);      // the great round tower
      { const X0 = M.X(0.118), X1 = M.X(0.183), Y = M.Y(0.468); at(0.15, 0.47, tmp); g.globalAlpha = 0.6; g.fillStyle = rgb(tmp, 1.5, 1.1, 0.88); g.fillRect(X0, Y, (X1 - X0) * 0.5, 2.2); g.fillStyle = rgb(tmp, 0.6); g.fillRect(X0, Y + 2.2, X1 - X0, 1.8); g.fillRect(M.X(0.146), M.Y(0.5), 5, 8); }
      // the leaves that grow over the walls' feet, so the town sits in the hill
      for (let i = 0; i < 380; i++) { const x = 0.01 + 0.34 * r(), y = 0.57 + 0.05 * r(); at(x, 0.6, tmp); dab(g, M.X(x), M.Y(y), 2 + r() * 3.5, 1.6 + r() * 2.5, r() * 3, rgb(tmp, 0.75 + 0.4 * r()), 0.6); }
      // the small temple on the ledge of the cliff
      { const X0 = M.X(0.397), X1 = M.X(0.435), Y0 = M.Y(0.378), Y1 = M.Y(0.424), w = X1 - X0; at(0.415, 0.4, tmp);
        g.globalAlpha = 0.92; g.fillStyle = rgb(tmp, 1.12, 1.03); g.fillRect(X0, Y0, w, Y1 - Y0); g.fillStyle = rgb(tmp, 1.34, 1.05); g.fillRect(X0, Y0, w * 0.45, Y1 - Y0);
        g.beginPath(); g.moveTo(X0 - 2, Y0); g.lineTo(X0 + w / 2, Y0 - 8); g.lineTo(X1 + 2, Y0); g.fill();
        g.globalAlpha = 0.8; g.fillStyle = rgb(tmp, 0.6); for (let i = 0; i < 3; i++) g.fillRect(X0 + w * (0.14 + 0.29 * i), Y0 + 7, w * 0.15, Y1 - Y0 - 7); }

      // ---- the round temple on the summit: columns round a dark cella, the entablature, the dome, lit from the left
      {
        const T = TEMPLE, k = T.k, cx = M.X(T.x), by = M.Y(T.y) + 3, w = 0.074 * k * reg[2] / 0.68, ch = 0.033 * k * reg[3] / 0.5, eh = 0.0075 * k * reg[3] / 0.5, dh = 0.026 * k * reg[3] / 0.5;
        const stone = (li, al = 1) => { g.globalAlpha = al; return `rgb(${Math.round(110 + 132 * li)},${Math.round(104 + 114 * li)},${Math.round(88 + 76 * li)})`; };
        const both = fn => { fn(g); a.globalAlpha = 1; a.fillStyle = '#fff'; fn(a); };
        g.fillStyle = stone(0.5); both(c => c.fillRect(cx - w / 2 - 5, by - 5, w + 10, 6));                                    // the step it stands on
        g.fillStyle = 'rgb(70,67,56)'; g.globalAlpha = 1; both(c => c.fillRect(cx - w / 2 + 1, by - 5 - ch, w - 2, ch));        // the dark of the cella
        for (let i = 0; i < 8; i++) { const th = (-74 + 148 * i / 7) * Math.PI / 180, x = cx + Math.sin(th) * (w / 2 - 4), wd = 3.5 + 5 * Math.cos(th), li = clamp01(0.6 - Math.sin(th) * 0.5);
          g.fillStyle = stone(li, 0.92); g.fillRect(x - wd / 2, by - 5 - ch, wd, ch); g.fillStyle = stone(li * 0.5, 0.55); g.fillRect(x + wd * 0.15, by - 5 - ch, wd * 0.35, ch); }
        { const gr = g.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0); gr.addColorStop(0, stone(0.9)); gr.addColorStop(0.4, stone(1)); gr.addColorStop(1, stone(0.3)); g.globalAlpha = 1; g.fillStyle = gr; both(c => c.fillRect(cx - w / 2 - 2, by - 5 - ch - eh, w + 4, eh)); }
        g.fillStyle = 'rgb(84,80,66)'; g.globalAlpha = 0.6; g.fillRect(cx - w / 2, by - 5 - ch, w, 1.6);
        { const ty = by - 5 - ch - eh, gr = g.createRadialGradient(cx - w * 0.2, ty - dh * 0.6, 2, cx, ty, w * 0.56); gr.addColorStop(0, stone(1)); gr.addColorStop(0.45, stone(0.8)); gr.addColorStop(1, stone(0.22)); g.globalAlpha = 1; g.fillStyle = gr;
          both(c => { c.beginPath(); c.ellipse(cx, ty + 0.5, w * 0.46, dh, 0, Math.PI, TAU); c.fill(); });
          g.fillStyle = stone(0.8); both(c => { c.beginPath(); c.ellipse(cx, ty - dh - 2, 2.6, 4, 0, 0, TAU); c.fill(); }); }
      }
      // its foot melts into the meadow
      a.globalAlpha = 1;
      { const gb = a.createLinearGradient(0, reg[1] + reg[3] - 16, 0, reg[1] + reg[3]); gb.addColorStop(0, 'rgba(0,0,0,0)'); gb.addColorStop(1, 'rgba(0,0,0,1)'); a.fillStyle = gb; a.fillRect(reg[0], reg[1] + reg[3] - 16, reg[2], 17);
        for (const [x0, x1] of [[reg[0], reg[0] + 14], [reg[0] + reg[2], reg[0] + reg[2] - 14]]) { const ge = a.createLinearGradient(x0, 0, x1, 0); ge.addColorStop(0, 'rgba(0,0,0,1)'); ge.addColorStop(1, 'rgba(0,0,0,0)'); a.fillStyle = ge; a.fillRect(reg[0], reg[1], reg[2], reg[3]); } }
      shut(reg); });
    }

    // ---------------------------------------------------------- the trees: trunks, then leaf by leaf
    {
      const reg = REG.tree, win = WIN.tree, f = table(PIC.tree); let M;
      const at = (x, y, o) => f((x - 0.6) / 0.4, y / 0.62, o);
      // (where the leaves are; beyond the picture's right edge the crowns are rounded off)
      const lv = (x, y) => { if (x <= 1) return leavesAt((x - 0.6) / 0.4, y / 0.62); const cut = (x - 1) / (0.046 + 0.014 * Math.sin(y * 55) + 0.008 * Math.sin(y * 131 + 1)); const m = leavesAt((1 - (x - 1) * 0.7 - 0.6) / 0.4, y / 0.62) * clamp01(1.15 - cut * cut); return m < 0.4 ? 0 : m; };
      const trunk = (pts, w0, w1, bark = 'rgb(40,35,27)', lit = 'rgb(98,82,56)', shape = true) => { for (const [ctx, style, dx, k] of [[g, bark, 0, 1], [a, '#fff', 0, 1], [g, lit, -1, 0.34]]) { if (ctx === a && !shape) continue; ctx.globalAlpha = 1; ctx.strokeStyle = style; ctx.lineCap = 'round';
        for (let i = 1; i < pts.length; i++) { ctx.lineWidth = (w0 + (w1 - w0) * i / (pts.length - 1)) * k; ctx.beginPath(); ctx.moveTo(M.X(pts[i - 1][0]) + dx * w0 * 0.3, M.Y(pts[i - 1][1])); ctx.lineTo(M.X(pts[i][0]) + dx * w0 * 0.3, M.Y(pts[i][1])); ctx.stroke(); } } };
      steps.push(() => { M = open(reg, win);
      ground(reg, f, s => s * 0.47 / 0.4);
      { const gw = 94, gh = 124, c = document.createElement('canvas'); c.width = gw; c.height = gh; const cx = c.getContext('2d'), im = cx.createImageData(gw, gh);      // (whole in their depths; the leaves make their edges)
        for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { const v = Math.round(255 * clamp01((lv(0.6 + (i + 0.5) / gw * 0.47, (j + 0.5) / gh * 0.62) - 0.84) / 0.14)), o = (j * gw + i) * 4; im.data[o] = im.data[o + 1] = im.data[o + 2] = v; im.data[o + 3] = 255; }
        cx.putImageData(im, 0, 0); a.globalAlpha = 1; a.imageSmoothingEnabled = true; a.drawImage(c, reg[0], reg[1], reg[2], reg[3]); }
      trunk([[0.958, 0.628], [0.952, 0.55], [0.957, 0.48]], 6, 4);
      trunk([[0.878, 0.27], [0.84, 0.235], [0.8, 0.2]], 5, 2.5); trunk([[0.892, 0.31], [0.912, 0.25], [0.93, 0.2]], 5, 2.5); trunk([[0.878, 0.27], [0.865, 0.21], [0.85, 0.15]], 6, 3);
      // the small golden tree's trunk, thin against the sea, forking into its crown
      trunk([[0.893, 0.63], [0.888, 0.57], [0.879, 0.525], [0.868, 0.49], [0.855, 0.455]], 7, 3.5); trunk([[0.879, 0.525], [0.895, 0.49], [0.906, 0.46]], 4, 2.5);
      // the masses of leaves, deep inside the crowns only
      for (let i = 0; i < 1750; i++) { const x = 0.6 + 0.47 * r(), y = 0.62 * r(); if (lv(x, y) < 0.95 || lv(x - 0.02, y) < 0.8 || lv(x + 0.02, y) < 0.8 || lv(x, y - 0.02) < 0.8 || lv(x, y + 0.02) < 0.8) continue; at(x, y, tmp); const s = 5 + r() * 6;
        dab(g, M.X(x), M.Y(y), s * 1.2, s, r() * 3, rgb(tmp, 0.8 + 0.3 * r()), 0.8); dab(a, M.X(x), M.Y(y), s * 1.2, s, r() * 3, '#fff', 1); }
      for (let i = 0; i < 4200; i++) { const x = 0.6 + 0.47 * r(), y = 0.62 * r(); if (lv(x, y) < 0.9 || r() < 0.06) continue; at(x, y, tmp); const s = 2.6 + r() * 2.6, rot = r() * 3;
        dab(g, M.X(x), M.Y(y), s * 1.3, s, rot, rgb(tmp, 0.78 + 0.34 * r()), 0.8); dab(a, M.X(x), M.Y(y), s * 1.3, s, rot, '#fff', 1); }
      shut(reg); });
      // the leaves: thick in the masses, single where they end against the sky; the light on the upper left of each mass
      const leaves = n => { for (let i = 0; i < n; i++) {
        const x = 0.6 + 0.47 * r(), y = 0.62 * r(), m = lv(x, y); if (m < 0.04 || r() > (m > 0.8 ? 1 : m * 0.85)) continue;
        at(x, y, tmp); const e = lv(x - 0.014, y - 0.016), edge = e < m - 0.12, q = r(), s = m < 0.8 ? 1.1 + r() * 1.4 : 1.5 + r() * 2, X = M.X(x), Y = M.Y(y), rot = r() * 3.14;
        dab(g, X, Y, s * 1.5, s * 0.75, rot, edge && q < 0.5 ? rgb(tmp, 1.16 + 0.3 * r(), 1.1, 0.85) : rgb(tmp, q < 0.25 ? 0.7 + 0.12 * r() : q > 0.94 ? 1.16 : 0.86 + 0.24 * r(), q > 0.94 ? 1.06 : 1), 0.9);
        dab(a, X, Y, s * 1.5, s * 0.75, rot, '#fff', 1);
      } };
      for (let k = 0; k < 3; k++) steps.push(() => { M = open(reg, win); leaves(4500); shut(reg); });
      steps.push(() => { M = open(reg, win);
      // the tall tree's trunk, in front of the dark trees behind it, going up into its crown
      trunk([[0.93, 0.48], [0.922, 0.44], [0.908, 0.4], [0.9, 0.36], [0.893, 0.32], [0.88, 0.275]], 11, 8, 'rgb(40,40,30)', 'rgb(74,70,48)');
      for (let i = 0; i < 300; i++) { const x = 0.84 + 0.09 * r(), y = 0.23 + 0.07 * r(); if (lv(x, y) < 0.7) continue; at(x, y, tmp); const s = 1.5 + r() * 2; dab(g, M.X(x), M.Y(y), s * 1.5, s * 0.75, r() * 3, rgb(tmp, 0.75 + 0.4 * r()), 0.9); }
      for (let i = 0; i < 160; i++) { const y = 0.3 + 0.18 * r(), x = 0.893 + (y - 0.32) * 0.22 + (r() - 0.5) * 0.016, s = 1.4 + r() * 1.6, rot = r() * 3; at(x, y, tmp); dab(g, M.X(x), M.Y(y), s * 1.5, s * 0.75, rot, rgb(tmp, 0.7 + 0.5 * r()), 0.85); dab(a, M.X(x), M.Y(y), s * 1.5, s * 0.75, rot, '#fff', 1); }      // (the ivy on it)
      // the bushes at their feet; the wing's own foot goes softly into the meadow
      for (let i = 0; i < 600; i++) { const x = 0.8 + 0.25 * r(), y = 0.585 + 0.04 * r() * (0.4 + 0.6 * Math.sin((x - 0.76) * 26) ** 2) + 0.03 * clamp01((x - 1.0) / 0.05); at(x, Math.min(0.615, y), tmp); const s = 2 + r() * 3;
        dab(g, M.X(x), M.Y(y), s * 1.3, s, r() * 3, rgb(tmp, 0.65 + 0.45 * r()), 0.9); dab(a, M.X(x), M.Y(y), s * 1.3, s, r() * 3, '#fff', 1); }
      a.globalAlpha = 1; const gb = a.createLinearGradient(0, reg[1] + reg[3] - 14, 0, reg[1] + reg[3]); gb.addColorStop(0, 'rgba(0,0,0,0)'); gb.addColorStop(1, 'rgba(0,0,0,1)'); a.fillStyle = gb; a.fillRect(reg[0], reg[1] + reg[3] - 14, reg[2], 15);
      shut(reg); });
    }

    // ---------------------------------------------------------- the meadow: level strokes, in his bands of light and shade
    {
      const reg = REG.mead, win = WIN.mead, f = table(PIC.meadow), Y1 = win[3], dy = Y1 - 0.62; let M;
      const at = (x, y, o) => f(clamp01(x), (y - 0.62) / 0.38, o), lightOf = c => clamp01((0.3 * c[0] + 0.55 * c[1] + 0.15 * c[2] - 36) / 30);
      // (his bands of light a little firmer than the table has them, and the grass greener and more golden in them)
      const grass = (c, k) => { if (c[2] > c[0] + 4) return rgb(c, 0.94 + 0.1 * (k - 1));      // (the far water: left as it is)
        const li = lightOf(c); return `rgb(${Math.round(Math.min(255, c[0] * k * (1.02 + 0.78 * li)))},${Math.round(Math.min(255, c[1] * k * (1.12 + 0.62 * li)))},${Math.round(Math.min(255, c[2] * k * (0.86 + 0.36 * li)))})`; };
      steps.push(() => { M = open(reg, win);
      { const step = 12; g.globalAlpha = 1; for (let y = -step; y < reg[3] + step; y += step) for (let x = -step; x < reg[2] + step; x += step) { at(win[0] + (x + step / 2) / reg[2] * (win[1] - win[0]), 0.62 + clamp01((y + step / 2) / reg[3]) * dy, tmp); g.fillStyle = grass(tmp, 1); g.fillRect(reg[0] + x, reg[1] + y, step + 1, step + 1); } }
      for (let i = 0; i < 3000; i++) {
        const x = win[0] + r() * (win[1] - win[0]), y = 0.62 + dy * r(), q = r(); at(x, y, tmp);
        dab(g, M.X(x), M.Y(y), 12 + r() * 40, 1.2 + r() * 2.4, (r() - 0.5) * 0.06, grass(tmp, q < 0.25 ? 1.14 + 0.16 * r() : q > 0.85 ? 0.84 : 0.94 + 0.14 * r()), 0.55);
      }
      shut(reg); });
      steps.push(() => { M = open(reg, win);
      // its shape: whole under the rock and the trees and out to his band of light, where it ends (you stand in the dark
      // of his foreground); its sides and its near edge go in level streaks
      const want = (x, y) => {
        at(x, y, tmp); const li = lightOf(tmp);
        const edge = 0.48 + 0.05 * Math.sin(y * 19 + (x < 0.5 ? 0 : 2)) + 0.03 * Math.sin(y * 47 + 1) + 0.018 * Math.sin(y * 113 + x * 5) - (x < 0.5 ? 0 : 0.03);      // (not a rug: its sides wander)
        const end = Y1 - 0.03 - 0.03 * (0.5 + 0.5 * Math.sin(x * 8.3 + 0.6)) - 0.022 * (0.5 + 0.5 * Math.sin(x * 21 + 2));                                        // (nor its near edge)
        const side = clamp01((edge - Math.abs(x - 0.5)) / 0.09), near = clamp01((end - y) / 0.06 + 0.5 * li * clamp01((Y1 - 0.008 - y) / 0.03));
        return side * near * (0.9 + 0.1 * li);
      };
      { const gw = 128, gh = 40, c = document.createElement('canvas'); c.width = gw; c.height = gh; const cx = c.getContext('2d'), im = cx.createImageData(gw, gh);
        for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { const v = Math.round(255 * want(win[0] + (i + 0.5) / gw * (win[1] - win[0]), 0.62 + (j + 0.5) / gh * dy)), o = (j * gw + i) * 4; im.data[o] = im.data[o + 1] = im.data[o + 2] = v; im.data[o + 3] = 255; }
        cx.putImageData(im, 0, 0); a.globalAlpha = 1; a.imageSmoothingEnabled = true; a.drawImage(c, reg[0], reg[1], reg[2], reg[3]); }
      for (let i = 0; i < 9000; i++) { const x = win[0] + r() * (win[1] - win[0]), y = 0.62 + dy * r(), w = want(x, y); if (w < 0.01 || w > 0.8) continue; dab(a, M.X(x), M.Y(y), 10 + r() * 30, 1 + r() * 2.2, (r() - 0.5) * 0.04, r() < 0.75 - 0.5 * w ? '#fff' : '#000', 0.5); }
      shut(reg); });
    }

    // ---------------------------------------------------------- the bridge: dark arches, the light along its parapet
    steps.push(() => {
      const reg = REG.bridge, [X0, Y0, w, h] = reg;
      g.save(); g.beginPath(); g.rect(X0 - 4, Y0 - 4, w + 8, h + 8); g.clip(); g.globalAlpha = 1; g.fillStyle = 'rgb(50,49,36)'; g.fillRect(X0 - 4, Y0 - 4, w + 8, h + 8);
      for (let i = 0; i < 300; i++) dab(g, X0 + r() * w, Y0 + 14 + r() * (h - 14), 4 + r() * 6, 1.5 + r() * 2, 0, `rgb(${Math.round(40 + 26 * r())},${Math.round(40 + 24 * r())},${Math.round(28 + 16 * r())})`, 0.6);
      g.globalAlpha = 1; g.fillStyle = 'rgb(126,116,78)'; g.fillRect(X0, Y0 + 6, w, 4); g.fillStyle = 'rgb(88,82,58)'; g.fillRect(X0, Y0 + 10, w, 4);
      g.fillStyle = 'rgb(26,28,22)'; for (let i = 0; i < 5; i++) { const cx = X0 + w * (0.12 + 0.19 * i), aw = w * 0.058, top = Y0 + 42; g.beginPath(); g.moveTo(cx - aw, Y0 + h); g.lineTo(cx - aw, top); g.arc(cx, top, aw, Math.PI, 0); g.lineTo(cx + aw, Y0 + h); g.fill(); }
      g.restore();
      a.save(); a.beginPath(); a.rect(X0 + 1, Y0 + 1, w - 2, h - 2); a.clip(); a.globalAlpha = 1; a.fillStyle = '#fff'; a.fillRect(X0, Y0 + 6, w, h);
      for (const [x0, x1] of [[X0, X0 + 40], [X0 + w, X0 + w - 40]]) { const gh = a.createLinearGradient(x0, 0, x1, 0); gh.addColorStop(0, 'rgba(0,0,0,1)'); gh.addColorStop(1, 'rgba(0,0,0,0)'); a.fillStyle = gh; a.fillRect(X0, Y0, w, h); }
      const gb = a.createLinearGradient(0, Y0 + h - 12, 0, Y0 + h); gb.addColorStop(0, 'rgba(0,0,0,0)'); gb.addColorStop(1, 'rgba(0,0,0,1)'); a.fillStyle = gb; a.fillRect(X0, Y0 + h - 12, w, 13);
      a.restore(); rim(reg);
    });

    const tex = c => { const t = new THREE.CanvasTexture(c); t.flipY = false; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 4; return t; };
    const colours = tex(cc), shapes = tex(ca); colours.colorSpace = THREE.SRGBColorSpace;
    steps.push(() => { colours.needsUpdate = true; shapes.needsUpdate = true; });
    // A step at a time, between frames (so coming into the room is not held up); finished at once if a show begins first.
    this.finish = () => { while (steps.length) steps.shift()(); };
    const next = () => { if (!steps.length) return; steps.shift()(); if (steps.length) setTimeout(next, 0); };
    setTimeout(next, 0);
    return [colours, shapes];
  },

  hide() { this.smat.visible = false; for (let i = 0; i < 4; i++) this.sun.set(i, 0); },

  start(L, resumed) {
    this.finish();
    this.smat.visible = true;
    if (resumed) return;
    this.ts = 0; this.sunT = 0; this.mu = 0; this.u.uGone.value = 0;
    this.pipeUp(L);
  },
  back(L) { this.sun0 = this.sunT; this.pipeDown(L, 0.5); },
  end(L) { this.hide(); },
  reset(L) { if (this.smat) this.hide(); this.pipeDown(L, 0.05); },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return', calm = L.calm, u = this.u;
    if (showing) this.ts = L.t;
    const ts = this.ts;
    this.clock += dt * (calm ? 0.5 : 1);
    // ---- the sun: it climbs to the temple with the hymn, comes down over everything, and goes back the way it came
    if (showing) this.sunT = ts;
    else if (back) this.sunT = Math.min(this.sun0, this.sun0 + (T_PEAK - 1.8 - this.sun0) * ease.inOut(ramp(L.ret, 0, 0.56)));
    u.uShow.value = ts; u.uSun.value = this.sunT; u.uSlow.value = calm ? 1.5 : 0.85;
    u.uGone.value = back ? ramp(L.ret, 0.36, 1) : 0;
    u.uStir.value = this.clock * 1.5;
    // the shadow of a long cloud, crossing from the left now and then once the view is all in the sun
    const T_CLOUD = 11, slow = calm ? 0.5 : 1, EVERY = 24 / slow, since = (ts - T_CLOUD) % EVERY;
    if (ts > T_CLOUD && showing) u.uCloud.value.set(-2.4 + 0.24 * slow * since, ease.smooth(ramp(since, 0, 2)));
    else u.uCloud.value.y *= Math.max(0, 1 - dt * 2);
    // the warm pools on the floor come with the light on the meadow, and go with it
    const sunAt = t => ease.smooth(ramp(this.sunT, t, t + 1.4));
    this.sun.set(0, sunAt(T_PEAK + 1.9)); this.sun.set(1, sunAt(T_PEAK + 2.4)); this.sun.set(2, ease.smooth(ramp(this.sunT, 1.2, 4.6)));
    // (it comes up as the dome is lit, over most of a second, and settles: a swell, never a flash)
    { const up = calm ? 1.6 : 0.9, q = ease.smooth(ramp(this.sunT, T_PEAK - 0.7, T_PEAK - 0.7 + up)); this.sun.set(3, q * (1 - 0.45 * ease.smooth(ramp(this.sunT, T_PEAK + up, T_PEAK + up + 2.4)))); }
    if (showing) this.sing(L, L.t);
    L.voice().place();
  },

  // ---------------------------------------------------------------- the pipe
  // One reed pipe: two reeds a hair apart (the double pipe, in unison), softened, each note spoken and let go. All
  // through one gain, which comes up gently when a show begins (more slowly and lower when motion is reduced: no
  // sudden first sound) and is let down when the look ends.
  pipeUp(L) {
    const v = L.voice(), c = v.ctx, out = c && v.out(); if (!c || !out) return;
    if (!this.bus || this.busCtx !== c) {
      this.bus = c.createGain(); this.bus.gain.value = 0; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1900; lp.Q.value = 0.5;
      const body = c.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 950; body.Q.value = 1.1; body.gain.value = 5;
      this.bus.connect(body); body.connect(lp); lp.connect(out); this.busCtx = c;
    }
    const calm = L.calm;
    this.bus.gain.cancelScheduledValues(c.currentTime); this.bus.gain.setTargetAtTime(calm ? 0.75 : 1, c.currentTime, calm ? 1.2 : 0.35);
  },
  pipeDown(L, over) {
    const c = this.busCtx; if (!c || !this.bus) return;
    this.bus.gain.cancelScheduledValues(c.currentTime); this.bus.gain.setTargetAtTime(0, c.currentTime, over);
  },
  note(c, e, at) {
    const t0 = c.currentTime + Math.max(0, at), vol = 0.025, a = 0.05, end = t0 + e.d * (e.last ? 1.5 : 0.93), rel = e.last ? 0.7 : 0.09;
    const g = c.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + a); g.gain.setValueAtTime(vol, Math.max(t0 + a, end - 0.04)); g.gain.linearRampToValueAtTime(vol * 0.75, end); g.gain.exponentialRampToValueAtTime(0.0001, end + rel);
    g.connect(this.bus);
    for (const [type, mul, k] of [['sawtooth', 1, 0.6], ['square', 1.0025, 0.3], ['sine', 1, 0.5]]) {
      const o = c.createOscillator(), og = c.createGain(); o.type = type; o.frequency.value = e.f * mul; og.gain.value = k;
      o.connect(og); og.connect(g); o.start(t0); o.stop(end + rel + 0.05);
    }
  },
  sing(L, t) {
    const v = L.voice(), c = v.ctx, to = t + 0.3, from = this.mu;
    if (to <= from) return;
    this.mu = to;
    if (L.quiet || !c) return;
    if (!this.bus || this.busCtx !== c) this.pipeUp(L);
    if (!this.bus) return;
    for (let n = Math.max(0, Math.floor((from - T_HYMN) / AGAIN)); T_HYMN + n * AGAIN < to; n++) {
      const b = T_HYMN + n * AGAIN; if (b + STANZA < from) continue;
      for (const e of SUNG) { const at = b + e.t; if (at >= from && at < to) this.note(c, e, at - t); }
    }
  },
});
