// Which picture has something wrong with it, and where.
//
// A list in order of preference. Each entry names a famous public-domain picture by the museum's
// own id (and, in case the id ever changes, by title and artist), the part of it that "needs
// special attention" as a rectangle in the image ([x0, y0, x1, y1], each 0 to 1, from the top left
// corner) and a phrase for that part. Every rectangle was drawn over the museum's own image of the
// picture and looked at; each has a generous margin.
//
// No DOM and no three.js: tools/build_layout.mjs reads this too, so that the passage is built behind
// the room the first of these in the saved copy hangs in.

export const CLUES = [
  { id: 27992, title: /^A Sunday on La Grande Jatte/i, artist: /Seurat/i, short: 'La Grande Jatte', part: 'the monkey on the lead', rect: [0.685, 0.755, 0.805, 0.9] },
  { id: 20684, title: /^Paris Street; Rainy Day/i, artist: /Caillebotte/i, short: 'Paris Street; Rainy Day', part: 'the lamp at the top of the lamp post', rect: [0.44, 0, 0.56, 0.13] },
  { id: 28560, title: /^The Bedroom$/i, artist: /van Gogh/i, short: 'The Bedroom', part: 'the green window', rect: [0.22, 0, 0.4, 0.3] },
  { id: 16568, title: /^Water Lilies$/i, artist: /Monet/i, short: 'Water Lilies', part: 'the signature, bottom right', rect: [0.74, 0.9, 1, 1] },
  { id: 87479, title: /^The Assumption of the Virgin$/i, artist: /Greco/i, short: 'The Assumption of the Virgin', part: 'the crescent moon under her feet', rect: [0.29, 0.39, 0.62, 0.49] },
];

// Does this work answer to that entry?
export const isClue = (c, w) => !!w && (w.id === c.id || (c.title.test(w.t || '') && c.artist.test(w.a || '')));

// The first on the list that is among `works` (a plain list of { id, t, a, g }), with the work.
export function firstClue(works) {
  for (const c of CLUES) { const w = works.find(x => isClue(c, x)); if (w) return { clue: c, work: w }; }
  return null;
}

// For a picture that is not on the list (the room the passage was built behind has been rehung):
// the bottom right-hand corner will have to do.
export const CORNER = { part: 'the bottom right-hand corner', rect: [0.72, 0.72, 1, 1] };
