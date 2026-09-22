#!/usr/bin/env node
// Assemble the deployable site into dist/.
//
// The tsc build (npm run build) emits the compiled JS into dist/js/. But the
// runtime also loads three things that live under src/ and are NOT emitted by
// tsc:
//   - src/index.html              (the page itself)
//   - src/css/style.css           (the theme)
//   - src/data/                   (game content: events, future achievements — fetched at runtime)
//
// This script copies those into dist/ so it becomes a self-contained site root
// for GitHub Pages:
//   dist/index.html
//   dist/css/style.css
//   dist/js/*.js                  (from the build)
//   dist/data/                    (game content: events, future achievements)
//
// index.html already references its assets relative to the site root (js/,
// css/), so it is copied as-is — no path rewriting needed.
//
// Run after `npm run build`.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const dist = path.join(root, 'dist');

function fail(message) {
  console.error(`[assemble] ${message}`);
  process.exit(1);
}

// The build must have run first.
if (!fs.existsSync(path.join(dist, 'js'))) {
  fail('dist/js/ not found — run "npm run build" first.');
}

// 1. src/index.html -> dist/index.html (copied as-is; it already references
//    js/ and css/ relative to the site root).
fs.copyFileSync(path.join(srcDir, 'index.html'), path.join(dist, 'index.html'));
console.log('[assemble] src/index.html -> dist/index.html');

// 2. src/css/ -> dist/css/
copyDir(path.join(srcDir, 'css'), path.join(dist, 'css'));
console.log('[assemble] src/css/ -> dist/css/');

// 3. src/data/ -> dist/data/ (game content: events, future achievements — fetched at runtime)
copyDir(path.join(srcDir, 'data'), path.join(dist, 'data'));
console.log('[assemble] src/data/ -> dist/data/');

console.log('[assemble] done — dist/ is ready to deploy.');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}
