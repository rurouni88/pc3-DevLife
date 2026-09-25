#!/usr/bin/env node
// Core game logic tests — `npm test`.
//
// The game ships as plain scripts (no modules, no bundler). This harness
// runs against the BUILT output (dist/js/) so it tests exactly what the
// browser loads. `npm test` builds first, then concatenates the pure-logic
// files in dependency order into a single Node VM context with stubbed
// browser globals. The test body (test/core.tests.js) runs in that same
// context and can touch game internals directly.
//
// ui.js / app.js need the DOM and are NOT executed here, but every JS
// file is still syntax-checked. events.js IS executed: its top-level
// fetch is guarded by `typeof fetch`, and tests populate EVENTS directly.

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const JS_DIR = path.join(__dirname, '..', 'dist', 'js');

// The game shows CONFIG.version in its badge; package.json carries the same
// number for npm/CI. They must agree — injected so the test body can compare.
const PACKAGE_VERSION = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
).version;

// Cache-busting: every asset tag in index.html carries ?v=<version>. A stale
// cached file is a classic static-site bug (new code calling a function the
// old cached file lacks), so the test body verifies coverage and agreement.
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8');
// Path-agnostic (assets may live in js/ or dist/js/ after a build) but still
// anchored to src=/href= so the "ui.js" mention in a comment isn't counted.
const INDEX_ASSET_COUNT = (indexHtml.match(/(?:src|href)="[^"]*\.(?:js|css)(?:\?[^"]*)?"/g) || []).length;
const INDEX_VERSIONS = [...indexHtml.matchAll(/[?&]v=([\d.]+)/g)].map(m => m[1]);

// Executable in Node (no DOM/fetch at load time), in dependency order.
const RUN_FILES = ['config', 'seeded-rng', 'utils', 'events', 'archetypes', 'items', 'special', 'perks', 'achievements', 'meta', 'game', 'save'];

// 1. Syntax-check every JS file (including the DOM-bound ones)
for (const file of fs.readdirSync(JS_DIR).filter(f => f.endsWith('.js'))) {
  new vm.Script(fs.readFileSync(path.join(JS_DIR, file), 'utf8'), { filename: file });
}
console.log('✓ syntax: all js files parse');

// 2. Execute the logic modules + test body in one context
const sandbox = {
  console,
  assert,
  PACKAGE_VERSION,
  INDEX_ASSET_COUNT,
  INDEX_VERSIONS,
  localStorage: {
    _data: {},
    getItem(k) { return Object.hasOwn(this._data, k) ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
  },
  document: { getElementById: () => null, addEventListener() {} },
  UI: { showToast() {}, renderPerks() {}, announcePerkChanges() {} },
};
sandbox.window = sandbox;
vm.createContext(sandbox);

const src = RUN_FILES
  .map(f => fs.readFileSync(path.join(JS_DIR, f + '.js'), 'utf8'))
  .join('\n;\n');
const tests = fs.readFileSync(path.join(__dirname, 'core.tests.js'), 'utf8');

try {
  vm.runInContext(src + '\n;\n' + tests, sandbox, { filename: 'core.tests.js' });
  console.log('\n✓ all core tests passed');
} catch (err) {
  console.error('\n✗ test failed:');
  console.error(err);
  process.exit(1);
}
