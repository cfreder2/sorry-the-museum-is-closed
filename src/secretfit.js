// What stands in the rooms that are on no drawing: a government store, twelve metres down.
//
// Invented from end to end. It is fitted out the way everything else back of house is, by
// src/furnish.js: the items and recipes here are added to that file's own (installSecretFit is called
// from it), so they are drawn in the same merged meshes, keep the same aisles and doorways clear and
// are solid in the same way. What cannot be made of painted boxes (the glass of a jar and the thing
// floating in it, the lettering on a crate, the saucer on its pedestal) is left as a `mark` for
// src/secret.js to finish.
//
// No three.js and no DOM in here.

// Lettering, by number: what src/secret.js paints into one small sheet and sticks on at each 'label' mark.
// kind: 'stencil' is sprayed straight onto a crate; 'sign' is a yellow warning plate; 'plate' a small engraved one.
export const LABELS = [
  { t: 'TOP SECRET', kind: 'stencil' }, { t: 'DO NOT OPEN', kind: 'stencil' }, { t: 'PROPERTY OF ▮▮▮▮▮▮▮', kind: 'stencil' }, { t: 'THIS WAY UP (WE THINK)', kind: 'stencil' },
  { t: 'DANGER', s: 'NOT OF THIS EARTH', kind: 'sign' }, { t: 'EYES ONLY', s: 'AND NOT MANY OF THOSE', kind: 'sign' }, { t: 'NO PHOTOGRAPHS', s: 'NO QUESTIONS', kind: 'sign' }, { t: 'DO NOT TAP', s: 'THE GLASS', kind: 'sign' },
  { t: 'HERE', kind: 'plate' }, { t: 'ROSWELL', kind: 'plate' }, { t: 'TUNGUSKA', kind: 'plate' }, { t: 'RENDLESHAM', kind: 'plate' }, { t: 'ZETA RETICULI', kind: 'plate' },
  { t: 'OBJECT 9', s: 'DO NOT SIT IN IT', kind: 'sign' }, { t: 'FRAGILE', kind: 'stencil' }, { t: 'ITEM 12', kind: 'plate' },
];

export function installSecretFit({ def, RECIPES, FITOUT, OPTS, C, pick }) {
  const X = { olive: 0x4b5338, oliveD: 0x353b28, haz: 0xd8a418, black: 0x19191b, steel: 0x7c858c, steelD: 0x30353a, alloy: 0xaab4ba, green: 0x4dff8a, greenD: 0x1c7a3e, violet: 0xb07bff, amber: 0xffb347, red: 0xff4a3a, cyan: 0x6fe8ff, tarp: 0x5a6148, tarpD: 0x474d39 };
  // A band of black and yellow along the front of something, `n` stripes of it.
  const hazard = (g, u0, u1, y0, y1, d) => { const n = Math.max(2, Math.round((u1 - u0) / 0.11)); for (let i = 0; i < n; i++) g.b(u0 + (u1 - u0) * i / n, u0 + (u1 - u0) * (i + 1) / n, y0, y1, d, d + 0.004, i % 2 ? X.black : X.haz); };

  // A specimen jar: the plinth it stands on and the lid with its pipes. The glass, the green and what floats in it are src/secret.js's.
  def('xJar', 1.4, 1.4, (g, w, r, o = {}) => {
    const big = o.size !== 'mid', rad = big ? 0.5 : 0.36, h = big ? 2.3 + r() * 0.3 : 1.35 + r() * 0.25, base = big ? 0.22 : 0.5, u = 0, d = 0.7;
    g.c(u, base / 2, d, rad + 0.08, base, 'y', X.steelD, 'metal', 14); g.c(u, base - 0.02, d, rad + 0.1, 0.04, 'y', X.steel, 'metal', 14);
    g.c(u, base + h + 0.07, d, rad + 0.06, 0.14, 'y', X.steelD, 'metal', 14); g.c(u, base + h + 0.17, d, rad * 0.5, 0.08, 'y', X.steel, 'metal', 10);
    g.c(u - rad * 0.3, (base + h + 0.2 + g.H) / 2, d - rad * 0.2, 0.035, g.H - base - h - 0.2, 'y', X.steel, 'metal', 6); g.c(u + rad * 0.3, (base + h + 0.2 + g.H) / 2, d - rad * 0.2, 0.02, g.H - base - h - 0.2, 'y', C.copper, 'metal', 6);
    g.b(u + rad + 0.1, u + rad + 0.3, 0, 0.5, d - 0.1, d + 0.1, X.steelD, 'metal'); g.b(u + rad + 0.13, u + rad + 0.17, 0.4, 0.44, d + 0.1, d + 0.104, X.green, 'glow'); g.b(u + rad + 0.21, u + rad + 0.25, 0.4, 0.44, d + 0.1, d + 0.104, r() < 0.3 ? X.red : X.amber, 'glow');
    g.c(u, base + 0.012, d, rad - 0.02, 0.02, 'y', X.green, 'glow', 14);                       // lit from underneath
    g.s(u - rad - 0.08, u + rad + 0.08, 0, base + h + 0.2, d - rad - 0.08, d + rad + 0.08);
    g.mark('jar', u, d, base, { r: rad, h, big });
  });
  // Shelves of small jars, each with something green or violet in it.
  def('xShelfJars', 1.6, 0.42, (g, w, r) => {
    const e = w / 2;
    for (const u of [-e + 0.02, e - 0.02]) g.bs(u - 0.02, u + 0.02, 0, 1.9, 0.02, 0.4, X.steelD, 'metal');
    for (const y of [0.3, 0.75, 1.2, 1.65]) {
      g.b(-e, e, y - 0.03, y, 0.02, 0.4, X.steel, 'metal', true);
      for (let u = -e + 0.14; u < e - 0.1; u += 0.17 + r() * 0.1) { const hh = 0.12 + r() * 0.14, rr = 0.04 + r() * 0.03, c = pick(r, [X.green, X.green, X.green, X.violet, X.amber, X.cyan]); g.c(u, y + hh / 2, 0.21, rr, hh, 'y', c, 'glow', 8); g.c(u, y + hh + 0.012, 0.21, rr + 0.004, 0.024, 'y', X.steelD, 'metal', 8); }
    }
    g.s(-e, e, 0, 1.9, 0.02, 0.4);
  });
  // The pedestal in the middle of it all. What stands on it is src/secret.js's.
  def('xPedestal', 1.9, 1.9, (g) => {
    const d = 0.95;
    g.b(-0.95, 0.95, 0, 0.1, 0, 1.9, X.steelD, 'metal'); hazard(g, -0.95, 0.95, 0.02, 0.09, 1.9); hazard(g, -0.95, 0.95, 0.02, 0.09, -0.004);
    g.c(0, 0.3, d, 0.62, 0.4, 'y', X.black, 'metal', 16); g.c(0, 0.53, d, 0.5, 0.06, 'y', X.alloy, 'metal', 16); g.c(0, 0.565, d, 0.42, 0.012, 'y', X.green, 'glow', 16);
    for (const [su, sd] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.c(su * 0.88, 0.4, d + sd * 0.88, 0.022, 0.8, 'y', X.alloy, 'metal', 6); g.c(su * 0.88, 0.82, d + sd * 0.88, 0.04, 0.04, 'y', X.red, 'glow', 6); }
    g.s(-0.62, 0.62, 0, 0.56, d - 0.62, d + 0.62);
    g.mark('ufo', 0, d, 0.56, {});
    g.mark('label', 0, 1.906, 0.3, { k: 13, w: 0.7, h: 0.3, lean: 0 });
  });
  // A rack of ray guns: three shelves, each with a row of them on pegs, no two quite alike.
  def('xGunRack', 2.0, 0.5, (g, w, r) => {
    const e = w / 2;
    for (const u of [-e + 0.025, e - 0.025]) g.bs(u - 0.025, u + 0.025, 0, 1.75, 0.02, 0.46, X.steelD, 'metal');
    g.b(-e, e, 0.1, 1.7, 0.02, 0.05, X.steelD, 'metal');                                       // the back board
    for (const y of [0.32, 0.8, 1.28]) {
      g.b(-e, e, y - 0.03, y, 0.02, 0.46, X.steel, 'metal', true);
      for (let u = -e + 0.3; u < e - 0.22; u += 0.44) {
        const c = pick(r, [0xb9383a, X.alloy, 0x2f8f8a, 0xc9a23a, 0x6a4fb0]), tip = pick(r, [X.green, X.red, X.cyan, X.violet, X.amber]), y0 = y + 0.12, dd = 0.26;
        g.b(u - 0.13, u + 0.06, y0, y0 + 0.07, dd - 0.03, dd + 0.03, c, 'metal');                                    // the body
        g.b(u - 0.1, u - 0.05, y0 - 0.1, y0, dd - 0.022, dd + 0.022, X.black);                                       // the grip
        g.c(u + 0.13, y0 + 0.035, dd, 0.018, 0.16, 'u', X.alloy, 'metal', 6);                                        // the barrel
        for (const k of [0.09, 0.13, 0.17]) g.c(u + k, y0 + 0.035, dd, 0.034 - (k - 0.09) * 0.12, 0.012, 'u', c, 'metal', 8);      // cooling rings
        g.c(u + 0.215, y0 + 0.035, dd, 0.024, 0.02, 'u', tip, 'glow', 8);                                            // the business end
        g.c(u - 0.04, y0 + 0.09, dd, 0.025, 0.04, 'y', tip, 'glow', 6);                                              // a little lit cell on top
      }
    }
    g.b(-e + 0.2, e - 0.2, 1.72, 1.76, 0.02, 0.46, X.steel, 'metal', true);
    g.s(-e, e, 0, 1.76, 0.02, 0.46);
  });
  // A crate with a stripe round it and something sprayed on the front; sometimes another on top.
  def('xCrate', 1.5, 1.0, (g, w, r) => {
    const crate = (u0, u1, y0, y1, d0, d1, lab) => {
      const c = r() < 0.6 ? X.olive : C.pine, c2 = c === X.olive ? X.oliveD : C.cardD;
      g.b(u0, u1, y0, y1, d0, d1, c);
      for (const u of [u0, u1 - 0.06]) g.b(u, u + 0.06, y0, y1, d1, d1 + 0.02, c2); g.b(u0, u1, y0, y0 + 0.06, d1, d1 + 0.02, c2); g.b(u0, u1, y1 - 0.06, y1, d1, d1 + 0.02, c2);
      hazard(g, u0 + 0.06, u1 - 0.06, y1 - 0.15, y1 - 0.07, d1 + 0.001);
      g.mark('label', (u0 + u1) / 2, d1 + 0.008, (y0 + y1) / 2 - 0.06, { k: lab, w: Math.min(0.95, u1 - u0 - 0.2), h: Math.min(0.26, (y1 - y0) * 0.4) });
    };
    const cw = 1.0 + r() * 0.4, h = 0.7 + r() * 0.5, cd = 0.6 + r() * 0.3; let top = h;
    crate(-cw / 2, cw / 2, 0, h, 0.02, 0.02 + cd, pick(r, [0, 0, 1, 2, 3, 14]));
    if (r() < 0.55) { const h2 = 0.4 + r() * 0.35; crate(-cw / 2 + 0.08, cw / 2 - 0.2, h, h + h2, 0.06, cd - 0.04, pick(r, [1, 2, 14, 0])); top = h + h2; }
    g.s(-cw / 2, cw / 2, 0, top, 0.02, 0.04 + cd);
  });
  // Odd devices. Nobody upstairs could tell you what any of them does.
  def('xDevice', 1.0, 1.0, (g, w, r) => {
    const k = r(), d = 0.5;
    if (k < 0.3) {                 // a coil with a ball on top
      g.c(0, 0.08, d, 0.34, 0.16, 'y', X.steelD, 'metal', 12);
      for (let y = 0.2; y < 1.2; y += 0.09) g.c(0, y, d, 0.16, 0.05, 'y', (Math.round(y * 100) % 2) ? C.copper : X.steel, 'metal', 10);
      g.c(0, 1.36, d, 0.03, 0.3, 'y', X.steel, 'metal', 6); g.c(0, 1.6, d, 0.15, 0.22, 'y', X.violet, 'glow', 10);
      g.s(-0.34, 0.34, 0, 1.7, d - 0.34, d + 0.34);
    } else if (k < 0.55) {         // a dish on a pole, pointing at nothing
      g.c(0, 0.04, d, 0.3, 0.08, 'y', X.steelD, 'metal', 10); g.c(0, 0.75, d, 0.035, 1.4, 'y', X.steel, 'metal', 6);
      g.c(0, 1.5, d + 0.1, 0.42, 0.05, 'd', X.alloy, 'metal', 14); g.c(0, 1.5, d + 0.2, 0.03, 0.2, 'd', X.steelD, 'metal', 6); g.c(0, 1.5, d + 0.31, 0.05, 0.05, 'd', X.red, 'glow', 8);
      g.s(-0.3, 0.3, 0, 1.9, d - 0.3, d + 0.3);
    } else if (k < 0.8) {          // something that glows, kept in a cage
      g.b(-0.4, 0.4, 0, 0.5, d - 0.4, d + 0.4, X.steelD, 'metal'); hazard(g, -0.4, 0.4, 0.4, 0.48, d + 0.4);
      for (const su of [-1, 1]) for (const sd of [-1, 1]) g.b(su * 0.37 - 0.02, su * 0.37 + 0.02, 0.5, 1.3, d + sd * 0.37 - 0.02, d + sd * 0.37 + 0.02, X.steel, 'metal');
      g.b(-0.4, 0.4, 1.3, 1.34, d - 0.4, d + 0.4, X.steel, 'metal', true);
      g.c(0, 0.9, d, 0.2, 0.3, 'y', pick(r, [X.green, X.cyan, X.amber]), 'glow', 10); g.c(0, 0.62, d, 0.08, 0.24, 'y', X.steel, 'metal', 6);
      g.s(-0.4, 0.4, 0, 1.34, d - 0.4, d + 0.4);
    } else {                       // a desk of dials
      g.b(-0.45, 0.45, 0, 0.8, 0.1, 0.8, X.steelD, 'metal'); g.b(-0.45, 0.45, 0.8, 1.25, 0.1, 0.3, X.steelD, 'metal');
      for (let u = -0.36; u < 0.4; u += 0.18) { g.c(u, 1.08, 0.3, 0.06, 0.02, 'd', C.white, 'matte', 10); g.b(u - 0.03, u + 0.03, 0.88, 0.94, 0.3, 0.304, pick(r, [X.green, X.red, X.amber, X.cyan]), 'glow'); }
      g.b(-0.3, 0.3, 0.8, 0.82, 0.4, 0.7, X.black); g.s(-0.45, 0.45, 0, 1.25, 0.1, 0.8);
    }
  });
  // A piece of something that came down hard, under a tarpaulin, taped off.
  def('xWreck', 4.4, 3.6, (g, w, r) => {
    const d = 1.8;
    g.c(0.3, 0.42, d, 1.55, 0.3, 'y', X.alloy, 'metal', 20); g.c(0.3, 0.2, d, 1.0, 0.24, 'y', X.steelD, 'metal', 16); g.c(0.3, 0.7, d, 0.7, 0.3, 'y', X.alloy, 'metal', 16); g.c(0.3, 0.9, d, 0.45, 0.14, 'y', X.cyan, 'glow', 12);
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + 0.3; g.c(0.3 + Math.cos(a) * 1.45, 0.42, d + Math.sin(a) * 1.45, 0.06, 0.08, 'y', i % 3 ? X.steelD : X.green, i % 3 ? 'metal' : 'glow', 6); }
    // The tarpaulin: thrown over the west half of it, in folds.
    g.b(-1.5, 0.1, 0.06, 0.62, d - 1.5, d + 1.5, X.tarp); g.b(-1.2, 0.45, 0.62, 0.92, d - 1.0, d + 1.1, X.tarpD); g.b(-0.7, 0.6, 0.92, 1.08, d - 0.6, d + 0.7, X.tarp);
    g.b(-1.75, -1.5, 0, 0.36, d - 1.2, d + 1.3, X.tarpD); g.b(-1.0, 0.0, 0, 0.3, d + 1.5, d + 1.7, X.tarpD); g.b(-1.2, -0.2, 0, 0.26, d - 1.72, d - 1.5, X.tarp);
    // Bits of it, laid out and numbered, and one that is still warm.
    for (let i = 0; i < 6; i++) { const u = 1.0 + r() * 0.9, dd = d - 1.3 + i * 0.5 + r() * 0.2, s = 0.1 + r() * 0.16; g.b(u, u + s * 1.6, 0, 0.03 + r() * 0.08, dd, dd + s, i === 2 ? X.amber : X.alloy, i === 2 ? 'glow' : 'metal'); g.b(u + s * 1.6 + 0.04, u + s * 1.6 + 0.12, 0, 0.1, dd, dd + 0.004, X.haz); }
    // Posts and tape round the lot.
    const P = [[-2.1, 0.1], [2.1, 0.1], [2.1, 3.5], [-2.1, 3.5]];
    P.forEach(([u, dd], i) => { g.c(u, 0.45, dd, 0.03, 0.9, 'y', X.haz, 'metal', 6); g.c(u, 0.03, dd, 0.12, 0.06, 'y', X.black, 'matte', 8); g.s(u - 0.05, u + 0.05, 0, 0.9, dd - 0.05, dd + 0.05); const [u2, d2] = P[(i + 1) % 4]; if (i !== 1) g.b(Math.min(u, u2) - 0.005, Math.max(u, u2) + 0.005, 0.76, 0.82, Math.min(dd, d2) - 0.005, Math.max(dd, d2) + 0.005, i % 2 ? X.haz : X.black, 'matte', true); });
    g.s(-1.75, 1.85, 0, 1.08, d - 1.6, d + 1.6);
    g.mark('label', 0, 3.512, 0.5, { k: 4, w: 0.8, h: 0.5 });
  });
  // A wall of clocks, each telling the time somewhere that matters down here.
  def('xClocks', 3.3, 0.06, (g, w, r) => {
    g.b(-1.65, 1.65, 1.0, 1.95, 0, 0.02, X.steelD, 'metal');
    [9, 10, 8, 11, 12].forEach((k, i) => {
      const u = -1.28 + i * 0.64, y = 1.58, a = r() * 6.28, b = r() * 6.28;
      g.c(u, y, 0.03, 0.23, 0.03, 'd', X.black, 'matte', 16); g.c(u, y, 0.047, 0.2, 0.006, 'd', k === 8 ? X.green : C.white, k === 8 ? 'glow' : 'matte', 16);
      g.b(u + Math.min(0, Math.cos(a) * 0.16) - 0.008, u + Math.max(0, Math.cos(a) * 0.16) + 0.008, y + Math.min(0, Math.sin(a) * 0.16) - 0.008, y + Math.max(0, Math.sin(a) * 0.16) + 0.008, 0.051, 0.053, X.black);
      g.b(u + Math.min(0, Math.cos(b) * 0.1) - 0.012, u + Math.max(0, Math.cos(b) * 0.1) + 0.012, y + Math.min(0, Math.sin(b) * 0.1) - 0.012, y + Math.max(0, Math.sin(b) * 0.1) + 0.012, 0.053, 0.055, X.red);
      g.mark('label', u, 0.026, 1.16, { k, w: 0.56, h: 0.14 });
    });
  });
  // A warning, bolted to the wall at a height a toy can read.
  def('xSign', 1.2, 0.04, (g, w, r, o = {}) => { g.b(-0.5, 0.5, 0.45, 1.15, 0, 0.02, X.haz); g.b(-0.52, 0.52, 0.43, 0.45, 0, 0.025, X.black); g.b(-0.52, 0.52, 1.15, 1.17, 0, 0.025, X.black); g.mark('label', 0, 0.026, 0.8, { k: o.k != null ? o.k : pick(r, [4, 5, 6]), w: 0.94, h: 0.62 }); });
  // A steel table with something small under a sheet, a lamp over it and a tray of instruments.
  def('xTable', 2.0, 1.0, (g, w, r) => {
    g.b(-0.9, 0.9, 0.82, 0.86, 0.1, 0.9, X.alloy, 'metal', true);
    for (const u of [-0.84, 0.84]) for (const d of [0.16, 0.84]) g.bs(u - 0.025, u + 0.025, 0, 0.82, d - 0.025, d + 0.025, X.steelD, 'metal');
    g.b(-0.6, 0.45, 0.86, 0.98, 0.3, 0.7, C.tissue); g.b(-0.72, -0.5, 0.86, 1.06, 0.36, 0.64, C.tissue); g.b(0.3, 0.52, 0.86, 0.94, 0.42, 0.5, X.greenD);      // a hand has slipped out from under the sheet: three long fingers
    g.b(0.6, 0.85, 0.86, 0.88, 0.25, 0.55, X.steel, 'metal'); for (let i = 0; i < 4; i++) g.b(0.63 + i * 0.05, 0.65 + i * 0.05, 0.88, 0.89, 0.28, 0.5, X.alloy, 'metal');
    g.c(-0.85, 1.3, 0.15, 0.015, 0.9, 'y', X.steelD, 'metal', 6); g.b(-0.86, -0.3, 1.74, 1.76, 0.14, 0.5, X.steelD, 'metal', true); g.c(-0.3, 1.7, 0.5, 0.16, 0.08, 'y', X.steelD, 'metal', 10); g.c(-0.3, 1.655, 0.5, 0.13, 0.008, 'y', X.cyan, 'glow', 10);
    g.s(-0.9, 0.9, 0.8, 1.06, 0.1, 0.9);
  });

  // ---- the three rooms ----
  RECIPES.xVault = R => {
    const { L, W } = R;
    R.force('xPedestal', L / 2, W / 2, 'b+', 3.2);            // and 3 m of clear floor all round it
    // The north wall, which is what you see from the door: jars in a row, the clocks, and two boards.
    R.walls([['xJar', 1.4], ['xJar', 1.4], 'whiteboard', ['xJar', 1.4], 'xClocks', ['xJar', 1.4], ['whiteboard', 2.1], ['xJar', 1.4], ['xJar', 1.4], 'xGunRack'], { walls: 'side0', gap: 0.45, once: true });
    R.walls(['xGunRack', ['xSign', 1.2, { k: 5 }], 'xGunRack', 'filing', 'filing', 'filing', 'xDevice', 'xGunRack', 'xCrate'], { walls: 'end0', gap: 0.25, once: true });
    R.walls(['xCrate', 'xDevice', 'xCrate', ['xSign', 1.2, { k: 4 }], 'serverRack', 'serverRack', 'xGunRack', 'xCrate', 'xDevice'], { walls: 'end1', gap: 0.25, once: true });
    R.walls(['xCrate', 'filing', 'filing', 'xCrate', ['xSign', 1.2, { k: 6 }], 'xDevice', 'extinguisher', 'xCrate', 'xCrate', 'filing', 'xDevice', 'xCrate'], { walls: 'side1', gap: 0.3, once: true });
    for (const [a, b, f] of [[5.2, W - 5.4, 'b-'], [L - 5.2, W - 5.4, 'b-'], [5.2, 5.4, 'b+']]) if (R.putC('xWreck', a, b, f, 0.3)) break;
    R.scatter(['xCrate', 'xDevice', ['xJar', 1.4, { size: 'mid' }], 'xCrate', 'xDevice', 'xCrate', ['xJar', 1.4, { size: 'mid' }], 'xCrate'], 9, { gap: 0.9 });
    R.services('coldlights', 'pipes', 'pipes2');
  };
  RECIPES.xLab = R => {
    R.walls(['whiteboard', 'xShelfJars', 'sink', 'xShelfJars', ['xSign', 1.2, { k: 7 }], 'xShelfJars', 'workbench', 'xShelfJars', 'filing'], { gap: 0.2, once: true });
    R.grid(['xJar', 1.4, { size: 'mid' }], { da: 2.1, db: 1.8, face: 'a+', rows: 1, ma: 1.4 });
    R.scatter(['xTable', ['xJar', 1.4], 'xDevice'], 3, { gap: 0.5 });
    R.services('coldlights', 'pipes');
  };
  RECIPES.xBrief = R => {
    R.grid(['meetingTable', 2.0], { da: 2.0, db: 3.4, face: 'b+', centre: true, ma: 2.4 });
    R.walls(['whiteboard', 'xClocks', 'filing', 'filing', ['xSign', 1.2, { k: 6 }], 'serverRack', 'filing', 'xDevice'], { gap: 0.3, once: true });
    R.services('coldlights');
  };
  OPTS.xBrief = { side: true };
  FITOUT.unshift([/^Sub-level 9/i, 'xVault'], [/^Specimen room/i, 'xLab'], [/^Debriefing room/i, 'xBrief']);
}
