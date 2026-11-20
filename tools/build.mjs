// Stage the game in dist/ for itch.io: exactly the files the browser needs, as committed.
//
// GitHub Pages serves the repo itself (main, from the root), so it needs no build. itch wants one
// zip-like folder with index.html at its root. Only tracked files are copied, so nothing local
// (the offline image copy in data/img/, the books tool's cache, scratch worktrees) can slip in.
//
// usage: node tools/build.mjs
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROOT = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const DIST = path.join(ROOT, 'dist');
// What the page loads: the page, its style and manifest, the code, three.js, the icons, and the
// two data files read at run time (the collection, and the art books).
const SHIP = ['index.html', 'style.css', 'manifest.webmanifest', 'src', 'vendor', 'assets', 'data/collection.json', 'data/books.json'];

const files = execFileSync('git', ['ls-files', '-z', '--', ...SHIP], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean);
if (!files.includes('index.html')) { console.error('build stopped: index.html is not tracked.'); process.exit(1); }

fs.rmSync(DIST, { recursive: true, force: true });
let bytes = 0;
for (const f of files) {
  const to = path.join(DIST, f);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(path.join(ROOT, f), to);
  bytes += fs.statSync(to).size;
}
const build = (fs.readFileSync(path.join(DIST, 'src', 'main.js'), 'utf8').match(/const BUILD = '([^']+)'/) || [])[1] || 'unknown';
console.log(`dist/: ${files.length} files, ${(bytes / 1048576).toFixed(1)} MB, build ${build}`);
