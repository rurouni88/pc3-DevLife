#!/usr/bin/env node
// Smoke test — verifies the BUILT dist/ is a self-contained, deployable site.
//
// The logic tests (core.test.js) prove the game code is correct, but they can't
// catch a broken build: a typo'd import specifier, a missing emitted module, or
// an assemble step that drops the event JSON would fail in the browser yet pass
// every logic test. This test closes that gap by resolving the deployed site's
// references against the filesystem — no live server, so no port to open or
// process to kill.
//
// Run after `npm run build && npm run assemble` (i.e. via `npm test`).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

// 2. The module graph must be complete: every relative import in every built
//    JS file resolves to an existing file. A typo'd specifier or a missing
//    emit (tsc ran, but the file wasn't in the build) only shows up here.
function listJs(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? listJs(path.join(dir, e.name))
    : e.name.endsWith('.js') ? [path.join(dir, e.name)]
    : []);
}
let importCount = 0;
for (const file of listJs(path.join(dist, 'js'))) {
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const target = path.resolve(path.dirname(file), m[1]);
    assert.ok(fs.existsSync(target), `unresolved import in ${path.relative(dist, file)}: ${m[1]}`);
    importCount++;
  }
}
console.log(`✓ smoke: module graph complete (${importCount} relative imports resolve)`);

// 3. Every data file the game fetches at runtime must be present in dist/.
const eventsJs = fs.readFileSync(path.join(dist, 'js', 'data', 'events.js'), 'utf8');
const fetchPaths = [...eventsJs.matchAll(/['"](data\/[^'"]+\.json)['"]/g)].map(m => m[1]);
assert.ok(fetchPaths.length > 0, 'expected runtime data fetch paths in dist/js/data/events.js');
for (const ref of fetchPaths) {
  assert.ok(fs.existsSync(path.join(dist, ref)), `dist/ is missing a fetched data file: ${ref}`);
}
console.log(`✓ smoke: all ${fetchPaths.length} runtime-fetched data files present in dist/`);

// 4. assemble copied the game data and the Pages cache policy faithfully.
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
assert.ok(fs.existsSync(path.join(dist, '_headers')), 'dist/ is missing _headers (Pages cache policy)');
console.log('✓ smoke: _headers copied into dist/');

console.log('✓ smoke: dist/ is a self-contained, deployable site');
