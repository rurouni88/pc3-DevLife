#!/usr/bin/env node
// Smoke test — verifies the BUILT dist/ is a self-contained, deployable site.
//
// The logic tests (core.test.js) prove the game code is correct, but they can't
// catch a broken build: a typo'd script path in index.html, or an assemble step
// that drops the event JSON, would 404 in the browser yet pass every logic test.
// This test closes that gap by resolving the deployed site's references against
// the filesystem — no live server, so no port to open or process to kill.
//
// Run after `npm run build && npm run assemble` (i.e. via `npm test`).

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('✗ dist/index.html not found — run "npm run build && npm run assemble" first.');
  process.exit(1);
}

// 1. Every script/stylesheet the deployed page references must exist in dist/.
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const assetRefs = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))(?:\?[^"]*)?"/g)].map(m => m[1]);
assert.ok(assetRefs.length > 0, 'expected asset references in dist/index.html');
for (const ref of assetRefs) {
  assert.ok(fs.existsSync(path.join(dist, ref)), `dist/ is missing a referenced asset: ${ref}`);
}
console.log(`✓ smoke: all ${assetRefs.length} referenced scripts/stylesheets present in dist/`);

// 2. Every data file the game fetches at runtime must be present in dist/.
const eventsJs = fs.readFileSync(path.join(dist, 'js', 'data', 'events.js'), 'utf8');
const fetchPaths = [...eventsJs.matchAll(/['"](data\/[^'"]+\.json)['"]/g)].map(m => m[1]);
assert.ok(fetchPaths.length > 0, 'expected runtime data fetch paths in dist/js/data/events.js');
for (const ref of fetchPaths) {
  assert.ok(fs.existsSync(path.join(dist, ref)), `dist/ is missing a fetched data file: ${ref}`);
}
console.log(`✓ smoke: all ${fetchPaths.length} runtime-fetched data files present in dist/`);

// 3. assemble copied the game data faithfully (dist/data/ matches src/data/ exactly).
function listFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full).map(p => path.join(entry.name, p)));
    else out.push(entry.name);
  }
  return out.sort();
}
const srcData = listFiles(path.join(root, 'src', 'data'));
const distData = listFiles(path.join(dist, 'data'));
assert.deepStrictEqual(distData, srcData, 'dist/data/ must match src/data/');
console.log(`✓ smoke: ${srcData.length} data files copied into dist/data/`);

console.log('✓ smoke: dist/ is a self-contained, deployable site');
