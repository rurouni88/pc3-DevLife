#!/usr/bin/env node
// Assemble the deployable site into dist/.
//
// The tsc build (npm run build) emits the compiled JS into dist/js/. But the
// runtime also loads three things that live at the repo root and are NOT
// emitted by tsc:
//   - index.html              (the page itself)
//   - css/style.css           (the theme)
//   - js/events/phase_*.json  (event content, fetched at runtime)
//
// This script copies those into dist/ so it becomes a self-contained site
// root for GitHub Pages:
//   dist/index.html          (script srcs rewritten from dist/js/ to js/)
//   dist/css/style.css
//   dist/js/*.js             (from the build)
//   dist/js/events/phase_*.json
//
// Run after `npm run build`.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

function fail(message) {
  console.error(`[assemble] ${message}`);
  process.exit(1);
}

// The build must have run first.
if (!fs.existsSync(path.join(dist, 'js'))) {
  fail('dist/js/ not found — run "npm run build" first.');
}

// 1. index.html -> dist/index.html, rewriting dist/js/ -> js/ so the built
//    site's script tags point at the site root.
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const rewritten = html.replace(/dist\/js\//g, 'js/');
fs.writeFileSync(path.join(dist, 'index.html'), rewritten);
console.log('[assemble] index.html -> dist/index.html (dist/js/ -> js/)');

// 2. css/ -> dist/css/
copyDir(path.join(root, 'css'), path.join(dist, 'css'));
console.log('[assemble] css/ -> dist/css/');

// 3. js/events/ -> dist/js/events/ (event content, fetched at runtime)
copyDir(path.join(root, 'js', 'events'), path.join(dist, 'js', 'events'));
console.log('[assemble] js/events/ -> dist/js/events/');

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
