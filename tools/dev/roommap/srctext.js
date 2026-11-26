// Reading the game's own words out of its source, so that the map quotes them exactly and stays right when they change.
// Plain functions, no imports: dump.mjs hands this file's text to the page, which runs it there (and node can import it).
//
//   says(src)            every string handed to say / once / callout / toast in a piece of source, in order, as
//                        [{ fn, text, at }]: one entry per literal (a ?: with two strings gives two). A template
//                        literal keeps its ${...} holes, except those that name a plain constant of the same file.
//   blocks(src)          a file cut into its features: { id: source of that feature({ ... }) block }
//   literal(src, name)   the value of `const NAME = <array or object literal>` evaluated on its own (no outside names)

// Step over a string, template or comment starting at i; returns the index after it, or i if nothing starts here.
function skip(s, i) {
  const c = s[i];
  if (c === '/' && s[i + 1] === '/') { const j = s.indexOf('\n', i); return j < 0 ? s.length : j; }
  if (c === '/' && s[i + 1] === '*') { const j = s.indexOf('*/', i + 2); return j < 0 ? s.length : j + 2; }
  if (c === '\'' || c === '"') { let j = i + 1; while (j < s.length && s[j] !== c) { if (s[j] === '\\') j++; j++; } return j + 1; }
  if (c === '`') { let j = i + 1; while (j < s.length && s[j] !== '`') { if (s[j] === '\\') { j += 2; continue; } if (s[j] === '$' && s[j + 1] === '{') { j = close(s, j + 1) + 1; continue; } j++; } return j + 1; }
  return i;
}
// The index of the bracket that closes the one at i.
function close(s, i) {
  const open = s[i], shut = { '(': ')', '{': '}', '[': ']' }[open]; let d = 0;
  for (let j = i; j < s.length; j++) {
    const k = skip(s, j); if (k !== j) { j = k - 1; continue; }
    if (s[j] === open) d++; else if (s[j] === shut && --d === 0) return j;
  }
  return s.length - 1;
}
const unesc = t => t.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})|\\x([0-9a-fA-F]{2})|\\(\r?\n|.)/g, (m, a, b, c, d) => a ? String.fromCodePoint(parseInt(a, 16)) : b ? String.fromCharCode(parseInt(b, 16)) : c ? String.fromCharCode(parseInt(c, 16)) : d === 'n' ? '\n' : d === 't' ? '\t' : /\r?\n/.test(d) ? '' : d);
// Plain constants of a file, the ones written in capitals: const NEED = 10, FINE = 50, NAME = 'x'
export function consts(src) {
  const out = {};
  for (const m of src.matchAll(/(?:^|[\s,;])const\s+([^;\n]*?=[^;\n]*)/g)) for (const d of m[1].matchAll(/\b([A-Z][A-Z0-9_]*)\s*=\s*(-?\d+(?:\.\d+)?|'(?:[^'\\\n]|\\.)*')\s*(?=,|$|\/\/)/g)) if (!(d[1] in out)) out[d[1]] = d[2][0] === '\'' ? unesc(d[2].slice(1, -1)) : d[2];
  return out;
}
// The string literals in s[a..b), outermost only (a string inside a template's ${} is part of that template).
function literals(s, a, b, K) {
  const out = [];
  for (let i = a; i < b; i++) {
    const k = skip(s, i); if (k === i) continue;
    const c = s[i];
    if (c === '\'' || c === '"') out.push(unesc(s.slice(i + 1, k - 1)));
    else if (c === '`') out.push(unesc(s.slice(i + 1, k - 1).replace(/\$\{\s*([A-Za-z_$][\w$]*)\s*\}/g, (m, n) => (K && n in K ? K[n] : m))));
    i = k - 1;
  }
  return out;
}
// The top-level commas of the argument list whose '(' is at i: [[a, b], ...] for each argument.
function args(s, i) {
  const end = close(s, i), out = []; let a = i + 1, d = 0;
  for (let j = i + 1; j < end; j++) {
    const k = skip(s, j); if (k !== j) { j = k - 1; continue; }
    const c = s[j];
    if (c === '(' || c === '{' || c === '[') d++; else if (c === ')' || c === '}' || c === ']') d--; else if (c === ',' && d === 0) { out.push([a, j]); a = j + 1; }
  }
  out.push([a, end]); return out;
}
// Words, not a key or a reason: more than one word, or a capital, or some punctuation.
const wordy = t => t.trim().length > 1 && /[\sA-Z!?.…]/.test(t.trim());
const SAY = /(?:^|[^\w$])(say|once|callout|toast|hintOnce|tell)\s*\(/g;
export function says(src, K = consts(src)) {
  const out = [];
  for (let i = 0; i < src.length; i++) {
    const k = skip(src, i); if (k !== i) { i = k - 1; continue; }
    SAY.lastIndex = i; const m = SAY.exec(src); if (!m) break;
    // (a match that begins inside a string or comment further on: walk up to it)
    let j = i, inside = false; while (j < m.index) { const q = skip(src, j); if (q !== j) { if (q > m.index + m[0].length - 1) { inside = true; break; } j = q; } else j++; }
    const open = m.index + m[0].length - 1;
    if (inside) { i = skip(src, j) - 1; continue; }
    // (the words are the first argument, after the kit if it is handed in first and after the key of a once)
    const A = args(src, open), fn = m[1]; let from = 0;
    if (A[0] && /^\s*(k|kit|K|this\.k)\s*$/.test(src.slice(A[0][0], A[0][1]))) from++;
    if (fn === 'once' || fn === 'hintOnce') from++;
    const a = A[from]; if (a) for (const text of literals(src, a[0], a[1], K)) if (wordy(text)) out.push({ fn, text, at: m.index });
    i = open;
  }
  return out;
}
// A feature's prompts as near() hands them over: hint: '...' (the line under the action button).
export function hints(src, K = consts(src)) {
  const out = [];
  for (const m of src.matchAll(/\bhint:\s*/g)) { const a = m.index + m[0].length; let b = a, d = 0; for (; b < src.length; b++) { const k = skip(src, b); if (k !== b) { b = k - 1; continue; } const c = src[b]; if (c === '(' || c === '{' || c === '[') d++; else if (c === ')' || c === '}' || c === ']') { if (d === 0) break; d--; } else if (c === ',' && d === 0) break; } for (const text of literals(src, a, b, K)) if (wordy(text)) out.push({ fn: 'hint', text, at: m.index }); }
  return out;
}
// A file cut into its features: [{ id, pre, body }]. body is the feature({ ... }) itself; pre is what stands between
// the feature before and this one (the helpers written for it: what it draws its cards and notices with).
export function sections(src) {
  const out = [], re = /\b(?:feature|lifeFor|escapeFor)\(\s*(?:(\d+)\s*,\s*)?\{/g; let m, last = 0;
  while ((m = re.exec(src))) {
    const open = m.index + m[0].length - 1, end = close(src, open), body = src.slice(open, end + 1);
    const id = m[1] || (/\bid:\s*'([^']+)'/.exec(body) || [])[1]; if (id) out.push({ id, pre: src.slice(last, m.index), body });
    re.lastIndex = last = end;
  }
  return out;
}
export function blocks(src) { return Object.fromEntries(sections(src).map(q => [q.id, q.body])); }
export function literal(src, name) {
  const m = new RegExp('\\b(?:const|let)\\s+' + name + '\\s*=\\s*').exec(src); if (!m) return undefined;
  const i = m.index + m[0].length; if (!'[{'.includes(src[i])) return undefined;
  // (a name from outside the literal, a font say, stands for itself: its own name as a string)
  const code = 'return (' + src.slice(i, close(src, i) + 1) + ')', names = [];
  for (let n = 0; n < 24; n++) {
    try { return new Function(...names, code)(...names); } catch (e) { const q = e instanceof ReferenceError && /^(\S+) is not defined/.exec(e.message); if (!q || names.includes(q[1])) return undefined; names.push(q[1]); }
  }
  return undefined;
}
// What is lettered on a thing: the strings handed straight to fillText, in order.
export function drawn(src) {
  const out = [];
  for (const m of src.matchAll(/\bfillText\(\s*(?='|")/g)) { const i = m.index + m[0].length, k = skip(src, i); if (k > i) out.push(unesc(src.slice(i + 1, k - 1))); }
  return out;
}
// The words of one once('key', ...) in a file.
export function onceText(src, key, K = consts(src)) {
  const i = src.indexOf("once('" + key + "'"); if (i < 1) return [];
  return says(src.slice(i - 1, close(src, src.indexOf('(', i)) + 1), K).map(w => w.text);
}
// A line as a keyboard player reads it: where the words depend on touch or keys, the keys.
export const tidy = t => t.replace(/\$\{[^{}]*?(?:usedTouch|touch|\.matches)\s*\?\s*'[^']*'\s*:\s*(?:E\(\)|'([^']*)')\s*\}/g, (m, k) => k || 'E');
// Everything a piece of source can say, in the order it is written: [text, ...] without repeats.
export function words(src, K) { const all = [...says(src, K), ...hints(src, K)].sort((a, b) => a.at - b.at), seen = new Set(), out = []; for (const w of all) if (!seen.has(w.text)) { seen.add(w.text); out.push(w.text); } return out; }
