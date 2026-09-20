#!/usr/bin/env node
// Core game logic tests — `npm test`.
//
// The game is a static site (no modules, no bundler), so the pure-logic
// files are concatenated in dependency order and executed in a single Node
// VM context with stubbed browser globals. The test body
// (test/core.tests.js) runs in that same context and can touch game
// internals directly. No framework, no build step.
//
// ui.js / app.js / events.js need the DOM/fetch and are NOT executed here,
// but every JS file is still syntax-checked.

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const JS_DIR = path.join(__dirname, '..', 'js');

// Executable in Node (no DOM/fetch at load time), in dependency order.
const RUN_FILES = ['config', 'utils', 'archetypes', 'items', 'special', 'perks', 'meta', 'game', 'save'];

// 1. Syntax-check every JS file (including the DOM-bound ones)
for (const file of fs.readdirSync(JS_DIR).filter(f => f.endsWith('.js'))) {
  new vm.Script(fs.readFileSync(path.join(JS_DIR, file), 'utf8'), { filename: file });
}
console.log('✓ syntax: all js files parse');

// 2. Execute the logic modules + test body in one context
const sandbox = {
  console,
  assert,
  localStorage: {
    _data: {},
    getItem(k) { return Object.hasOwn(this._data, k) ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
  },
  document: { getElementById: () => null, addEventListener() {} },
  UI: { showToast() {}, renderPerks() {} },
};
sandbox.window = sandbox;
vm.createContext(sandbox);

// events.js is not executed (it needs fetch), but game logic references
// its load-time globals. Shim them with the same values events.js sets.
const EVENTS_SHIM = `
  let EVENTS = [];
  const EVENTS_PER_BOSS = CONFIG.game.eventsPerBoss;
  const BOSS_PREFIX = CONFIG.game.bossPrefix;
`;

const src = RUN_FILES
  .map(f => fs.readFileSync(path.join(JS_DIR, f + '.js'), 'utf8'))
  .join('\n;\n');
const tests = fs.readFileSync(path.join(__dirname, 'core.tests.js'), 'utf8');

try {
  vm.runInContext(src + '\n;\n' + EVENTS_SHIM + '\n;\n' + tests, sandbox, { filename: 'core.tests.js' });
  console.log('\n✓ all core tests passed');
} catch (err) {
  console.error('\n✗ test failed:');
  console.error(err);
  process.exit(1);
}
