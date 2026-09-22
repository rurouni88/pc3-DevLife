// Test body — runs in the SAME VM context as the game modules (see
// core.test.js), so game globals (Game, PerkSystem, SpecialSystem, d20,
// ...) are in scope. `assert` is node:assert, injected by the runner.

// Fresh run: reset stats/perks and give Game the minimal state the
// log/meta paths need.
function freshRun(stats) {
  SpecialSystem.init(stats);
  PerkSystem.reset();
  PerkSystem.refresh();
  Game.state = { careerLog: [], day: 1 };
}

// Full run state for choice tests (resolve/apply touch log/meta paths)
function fullRun(stats) {
  freshRun(stats);
  Object.assign(Game.state, {
    level: 1, levelUpPoints: 0, phase: 1, eventsCompleted: 0,
    equipment: [], consumables: [], eventHistory: [],
    bossCompleted: false, currentEventId: null, pendingEquipmentDrop: null,
    alive: true, won: false, startTime: 0, runNumber: 1
  });
}

// Synthetic events for the intervention tests. t_bf's check (S: 9) sits at
// the edge where Brute Force's +2 target can save it; t_grace's failure
// effect revokes Negotiate (C-2) but the intervention was earned at
// resolve time.
EVENTS = [
  {
    id: 't_intervene', title: 'Intervene Test', phase: 1, phaseLabel: 'Test', narrative: 'n',
    choices: [{
      text: 'Try', checks: { S: 5 },
      success: { text: 's', effects: { S: 1 }, log: 'won' },
      failure: { text: 'f', effects: { E: -4 }, log: 'lost' }
    }]
  },
  {
    id: 't_bf', title: 'BF Test', phase: 1, phaseLabel: 'Test', narrative: 'n',
    choices: [{
      text: 'Lift', checks: { S: 9 },
      success: { text: 's', effects: { S: 1 }, log: 'lifted' },
      failure: { text: 'f', effects: { E: -4 }, log: 'crushed' }
    }]
  },
  {
    id: 't_grace', title: 'Grace Test', phase: 1, phaseLabel: 'Test', narrative: 'n',
    choices: [{
      text: 'Talk', checks: { C: 5 },
      success: { text: 's', effects: { C: 1 }, log: 'talked' },
      failure: { text: 'f', effects: { C: -2 }, log: 'argued' }
    }]
  }
];
const NO_USE = { negotiate: false, bruteForce: false, codeReview: false };

// --- Phase names: single source in CONFIG ---
assert.strictEqual(CONFIG.game.phaseNames.length, 5, 'phase names indexed 0-4');
freshRun({ S: 5, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
Game.state.phase = 1;
Game.advancePhase();
assert.strictEqual(Game.state.phase, 2, 'phase advanced');
assert.ok(Game.state.careerLog[0].message.includes('Mid-Level Developer'), 'promotion log uses CONFIG phase name');
console.log('✓ phase names: single CONFIG source, promotion log correct');

// --- Version: the in-game badge and package.json must agree ---
assert.strictEqual(
  CONFIG.version, PACKAGE_VERSION,
  `CONFIG.version (${CONFIG.version}) must match package.json (${PACKAGE_VERSION})`
);
// Cache-busting: every asset tag in index.html carries a ?v= string, and
// they all match package.json — an unversioned or stale tag means the
// browser can serve old JS alongside new.
assert.strictEqual(
  INDEX_VERSIONS.length, INDEX_ASSET_COUNT,
  `every asset tag in index.html must carry a ?v= cache-buster (${INDEX_VERSIONS.length}/${INDEX_ASSET_COUNT})`
);
for (const v of INDEX_VERSIONS) {
  assert.strictEqual(v, PACKAGE_VERSION, `index.html ?v=${v} must match package.json (${PACKAGE_VERSION})`);
}
console.log('✓ version: CONFIG, package.json, and index.html cache-busters agree');

// --- Perk activation: stats at 10 unlock, dropping below revokes ---
freshRun({ S: 10, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
assert.ok(PerkSystem.has('brute_force'), 'S=10 activates Brute Force');
SpecialSystem.stats.S = 9;
PerkSystem.refresh();
assert.ok(!PerkSystem.has('brute_force'), 'S=9 revokes Brute Force');
console.log('✓ perk activation: unlock at 10, revoke below');

// --- resolveChoice: pure — no effects, no days, no history ---
fullRun({ S: 5, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
Math.random = () => 0.99; // no equipment drops, no redundancy/obsolescence
d20 = () => 20; // roll 20-5 = 15 vs 5 → fail
let rc = Game.resolveChoice(EVENTS[0], 0);
assert.strictEqual(rc.allSuccess, false, 'check failed');
assert.strictEqual(SpecialSystem.stats.E, 5, 'resolveChoice applies no effects');
assert.strictEqual(Game.state.day, 1, 'resolveChoice advances no days');
assert.strictEqual(Game.state.eventHistory.length, 0, 'resolveChoice logs no history');
assert.strictEqual(rc.interventions.negotiate, false, 'no C=10 → no negotiate');
assert.strictEqual(rc.interventions.bruteForce, false, 'no S=10 → no brute force');
assert.strictEqual(rc.interventions.codeReview, false, 'no P=10 → no code review');
// Declined: the full failure stands
let out = Game.applyChoice(rc, NO_USE);
assert.strictEqual(out.success, false, 'failure stands');
assert.strictEqual(SpecialSystem.stats.E, 1, 'full -4 E applied on apply');
assert.ok(Game.state.day > 1, 'day advanced on apply');
assert.strictEqual(Game.state.eventHistory.length, 1, 'history appended on apply');
console.log('✓ resolveChoice: pure phase — nothing applied until applyChoice');

// --- Negotiate: converts a fatal failure to a success (no death, no
//     failure effects, success effects apply) ---
fullRun({ S: 5, P: 5, E: 5, C: 10, I: 5, A: 5, L: 1 });
d20 = () => 20; // S check: 20-1 = 19 vs 5 → fail
rc = Game.resolveChoice(EVENTS[0], 0);
assert.strictEqual(rc.interventions.negotiate, true, 'negotiate offered (C=10)');
// Declined: the failure is fatal (E 5→1, saving roll 20-1 = 19 vs
// L+0.5C = 6 → fails the save)
let seq = [20, 20];
d20 = () => seq.shift();
rc = Game.resolveChoice(EVENTS[0], 0);
out = Game.applyChoice(rc, NO_USE);
assert.ok(out.gameOver, 'without negotiate the fatal failure kills');
assert.strictEqual(SpecialSystem.stats.E, 1, 'failure effects applied');
// Negotiated: the fatal failure never happens. (L=1 still trips the
// "luck ran out" death check — saving roll 1 vs L+0.5C = 6 survives.)
seq = [20, 1];
d20 = () => seq.shift();
fullRun({ S: 5, P: 5, E: 5, C: 10, I: 5, A: 5, L: 1 });
rc = Game.resolveChoice(EVENTS[0], 0);
out = Game.applyChoice(rc, { negotiate: true, bruteForce: false, codeReview: false });
assert.strictEqual(out.success, true, 'negotiate flips to success');
assert.ok(!out.gameOver, 'no death — the fatal failure never happened');
assert.strictEqual(SpecialSystem.stats.E, 5, 'failure effects never applied');
assert.strictEqual(SpecialSystem.stats.S, 6, 'success effect applied');
assert.ok(PerkSystem.negotiateUsed, 'perk consumed');
assert.strictEqual(out.checkResults[0].negotiated, true, 'check marked negotiated');
console.log('✓ negotiate: fatal failure converted to success, no death');

// --- Brute Force: +2 to the failed S check target, flips when it saves ---
fullRun({ S: 10, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
d20 = () => 15; // roll 15-5 = 10 vs 9 → fail; +2 target → 10 vs 11 → pass
rc = Game.resolveChoice(EVENTS[1], 0);
assert.strictEqual(rc.interventions.bruteForce, true, 'BF offered (S=10, failed S check)');
out = Game.applyChoice(rc, { negotiate: false, bruteForce: true, codeReview: false });
assert.strictEqual(out.success, true, 'BF flips to success');
assert.strictEqual(SpecialSystem.stats.E, 5, 'failure effects never applied');
assert.strictEqual(SpecialSystem.stats.S, 10, 'success effect clamped at max');
assert.ok(PerkSystem.bruteForceUsed, 'consumed');
// BF that cannot save: failure stands, perk still consumed
fullRun({ S: 10, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
d20 = () => 17; // roll 17-5 = 12 vs 9 → fail; +2 → 12 vs 11 → still fail
rc = Game.resolveChoice(EVENTS[1], 0);
out = Game.applyChoice(rc, { negotiate: false, bruteForce: true, codeReview: false });
assert.strictEqual(out.success, false, 'BF could not save it');
assert.strictEqual(SpecialSystem.stats.E, 1, 'failure effects applied');
assert.ok(PerkSystem.bruteForceUsed, 'consumed even when it failed');
console.log('✓ brute force: +2 target, flips when it saves, consumed either way');

// --- Code Review: halves the negative effects AT APPLY TIME ---
fullRun({ S: 5, P: 10, E: 5, C: 5, I: 5, A: 5, L: 5 });
d20 = () => 20; // roll 20-5 = 15 vs 5 → fail
rc = Game.resolveChoice(EVENTS[0], 0);
assert.strictEqual(rc.interventions.codeReview, true, 'CR offered (P=10, negative failure effects)');
out = Game.applyChoice(rc, { negotiate: false, bruteForce: false, codeReview: true });
assert.strictEqual(out.success, false, 'still a failure');
assert.strictEqual(SpecialSystem.stats.E, 3, 'halved at apply time: 5 - 2 = 3');
assert.deepStrictEqual(out.effects, { E: -2 }, 'result reports the halved effects');
assert.ok(PerkSystem.codeReviewUsed, 'consumed');
// Not spent when Negotiate already won (nothing to halve)
fullRun({ S: 5, P: 10, E: 5, C: 10, I: 5, A: 5, L: 5 });
d20 = () => 20;
rc = Game.resolveChoice(EVENTS[0], 0);
assert.strictEqual(rc.interventions.negotiate, true, 'both offered');
assert.strictEqual(rc.interventions.codeReview, true, 'both offered (CR)');
out = Game.applyChoice(rc, { negotiate: true, bruteForce: false, codeReview: true });
assert.strictEqual(out.success, true, 'negotiate wins');
assert.ok(!PerkSystem.codeReviewUsed, 'code review not spent (nothing to halve)');
assert.ok(PerkSystem.negotiateUsed, 'negotiate consumed');
console.log('✓ code review: halves at apply time, not wasted on a won event');

// --- Grace: the failure's own effect revokes the perk, but the
//     intervention was earned at resolve time (availability is frozen) ---
fullRun({ S: 5, P: 5, E: 5, C: 10, I: 5, A: 5, L: 5 });
d20 = () => 20; // roll 16 vs C 10 → fail
rc = Game.resolveChoice(EVENTS[2], 0);
assert.strictEqual(rc.interventions.negotiate, true, 'offered at resolve (C=10)');
out = Game.applyChoice(rc, { negotiate: true, bruteForce: false, codeReview: false });
assert.strictEqual(out.success, true, 'intervenes despite the effect that would revoke it');
assert.strictEqual(SpecialSystem.stats.C, 10, 'failure never applied; success effect clamped at max');
console.log('✓ grace: availability frozen at resolve time');

// --- Iron Nerves: once per run, a hit that would floor E stops it at 3 ---
EVENTS.push(
  {
    id: 't_floor', title: 'Floor Test', phase: 1, phaseLabel: 'Test', narrative: 'n',
    choices: [{
      text: 'Grind', checks: { S: 5 },
      success: { text: 's', effects: { S: 1 }, log: 'held on' },
      failure: { text: 'f', effects: { E: -9 }, log: 'collapsed' }
    }]
  },
  {
    id: 't_shallow', title: 'Shallow Test', phase: 1, phaseLabel: 'Test', narrative: 'n',
    choices: [{
      text: 'Push', checks: { S: 5 },
      success: { text: 's', effects: { S: 1 }, log: 'held on' },
      failure: { text: 'f', effects: { E: -8 }, log: 'wobbled' }
    }]
  }
);
// The save fires: E 10 → would be 1 → lands exactly at 3
fullRun({ S: 5, P: 5, E: 10, C: 5, I: 5, A: 5, L: 5 });
Math.random = () => 0.99;
d20 = () => 20; // S check: 15 vs 5 → fail
rc = Game.resolveChoice(EVENTS[3], 0);
out = Game.applyChoice(rc, NO_USE);
assert.strictEqual(out.success, false, 'failure stands');
assert.strictEqual(SpecialSystem.stats.E, 3, 'E lands at 3, not the floor');
assert.ok(!out.gameOver, 'no burnout death');
assert.ok(PerkSystem.ironNervesUsed, 'perk consumed');
assert.ok(out.ironNervesUsed, 'result flags the save for the toast');
assert.ok(Game.state.careerLog.some(e => e.message.includes('Iron Nerves')), 'save logged');
assert.strictEqual(EVENTS[3].choices[0].failure.effects.E, -9, 'shared event definition untouched');
// Once per run: the next floor hit kills (perk consumed AND revoked at E=3)
d20 = () => 20; // check fails; saving roll 20 vs 7.5 → fails → death
rc = Game.resolveChoice(EVENTS[3], 0);
out = Game.applyChoice(rc, NO_USE);
assert.ok(out.gameOver, 'second floor hit ends the run');
assert.strictEqual(SpecialSystem.stats.E, 1, 'E on the floor');
// No trigger when the hit lands above the floor: E 10 - 8 = 2
fullRun({ S: 5, P: 5, E: 10, C: 5, I: 5, A: 5, L: 5 });
d20 = () => 20;
rc = Game.resolveChoice(EVENTS[4], 0);
out = Game.applyChoice(rc, NO_USE);
assert.strictEqual(SpecialSystem.stats.E, 2, 'E lands at 2 — above the floor');
assert.ok(!PerkSystem.ironNervesUsed, 'save not spent');
assert.ok(!out.gameOver, 'no death at E=2');
// Code Review first: halving -9 to -5 lands E at 5 — save not needed, not spent
fullRun({ S: 5, P: 10, E: 10, C: 5, I: 5, A: 5, L: 5 });
d20 = () => 20;
rc = Game.resolveChoice(EVENTS[3], 0);
out = Game.applyChoice(rc, { negotiate: false, bruteForce: false, codeReview: true });
assert.strictEqual(SpecialSystem.stats.E, 5, 'halved -5 lands E at 5');
assert.ok(PerkSystem.codeReviewUsed, 'CR consumed');
assert.ok(!PerkSystem.ironNervesUsed, 'save not needed, not spent');
// Snapshot round-trip + old-save tolerance
PerkSystem.useIronNerves();
const snap = PerkSystem.clone();
assert.strictEqual(snap.ironNervesUsed, true, 'clone carries the flag');
PerkSystem.reset();
PerkSystem.restore(snap);
assert.strictEqual(PerkSystem.ironNervesUsed, true, 'restore brings the flag back');
PerkSystem.restore({ active: [], bruteForceUsed: false, codeReviewUsed: false, negotiateUsed: false, cleanDeployUsed: false });
assert.strictEqual(PerkSystem.ironNervesUsed, false, 'old-format snapshot (no field) → unused');
console.log('✓ iron nerves: once-per-run burnout save, lands at 3, not wasted');

// --- Difficulty (issue #6): a FAILED outcome's negatives are multiplied by
//     a d(negMultSides) roll. t_intervene's failure is E: -4. ---
// NORMAL, d2 rolled to 2 → -4 becomes -8
fullRun({ S: 5, P: 5, E: 10, C: 5, I: 5, A: 5, L: 5 });
Game.state.difficulty = 'normal';
d20 = () => 20;   // S check: 15 vs 5 → fail
dRoll = () => 2;  // force the d2 multiplier to ×2
rc = Game.resolveChoice(EVENTS[0], 0);
out = Game.applyChoice(rc, NO_USE);
assert.strictEqual(out.success, false, 'failure stands');
assert.deepStrictEqual(out.effects, { E: -8 }, 'normal d2=2 → -4 becomes -8');
assert.strictEqual(SpecialSystem.stats.E, 2, 'E 10 → 2 after the doubled hit');
// NORMAL, d2 rolled to 1 → no change
fullRun({ S: 5, P: 5, E: 10, C: 5, I: 5, A: 5, L: 5 });
Game.state.difficulty = 'normal';
d20 = () => 20;
dRoll = () => 1;  // ×1
rc = Game.resolveChoice(EVENTS[0], 0);
out = Game.applyChoice(rc, NO_USE);
assert.deepStrictEqual(out.effects, { E: -4 }, 'normal d2=1 → -4 unchanged');
// EASY: d1 (×1) — the multiplier is skipped entirely
fullRun({ S: 5, P: 5, E: 10, C: 5, I: 5, A: 5, L: 5 });
Game.state.difficulty = 'easy';
d20 = () => 20;
dRoll = () => 4;  // even a forced d4 is ignored on easy
rc = Game.resolveChoice(EVENTS[0], 0);
out = Game.applyChoice(rc, NO_USE);
assert.deepStrictEqual(out.effects, { E: -4 }, 'easy: no multiplier');
// Success outcomes are never multiplied
fullRun({ S: 5, P: 5, E: 10, C: 5, I: 5, A: 5, L: 5 });
Game.state.difficulty = 'normal';
d20 = () => 1;    // S check: 1-5 = -4 vs 5 → success
dRoll = () => 4;
rc = Game.resolveChoice(EVENTS[0], 0);
out = Game.applyChoice(rc, NO_USE);
assert.strictEqual(out.success, true, 'success');
assert.deepStrictEqual(out.effects, { S: 1 }, 'success effects untouched');
// Multiplier applies BEFORE Code Review: CR halves the already-doubled value
fullRun({ S: 5, P: 10, E: 10, C: 5, I: 5, A: 5, L: 5 });
Game.state.difficulty = 'normal';
d20 = () => 20;   // S check: 15 vs 5 → fail
dRoll = () => 2;  // ×2 → -8, then CR halves → -4
rc = Game.resolveChoice(EVENTS[0], 0);
out = Game.applyChoice(rc, { negotiate: false, bruteForce: false, codeReview: true });
assert.deepStrictEqual(out.effects, { E: -4 }, 'CR halves the doubled -8 → -4');
assert.strictEqual(SpecialSystem.stats.E, 6, 'E 10 → 6');
// restore the real dRoll (Math.random-driven) for later tests
dRoll = (sides) => Math.floor(Math.random() * sides) + 1;
console.log('✓ difficulty: failed negatives ×d2 (normal), skipped on easy/success, before code review');

// --- Consumable carry-over: pick = most recent, pool capped at 2 ---
localStorage.setItem('devlife_meta', JSON.stringify({ totalRuns: 0, startingConsumables: ['coffee', 'focus'] }));
MetaStore.addCarriedConsumable('espresso'); // new pick
assert.deepStrictEqual(MetaStore.carriedIds('startingConsumables'), ['focus', 'espresso'], 'new pick moves to end, oldest drops');
localStorage.setItem('devlife_meta', JSON.stringify({ totalRuns: 0, startingConsumables: ['espresso', 'coffee', 'focus'] }));
MetaStore.addCarriedConsumable('espresso'); // re-pick an older entry (issue #4 follow-up)
assert.deepStrictEqual(MetaStore.carriedIds('startingConsumables'), ['focus', 'espresso'], 're-pick refreshes recency, pool capped at 2');
localStorage.removeItem('devlife_meta');
console.log('✓ consumable carry-over: pick = most recent, pool capped at 2');

// --- MetaStore: corrupted meta JSON is ignored, not fatal ---
localStorage.setItem('devlife_meta', '{not json');
assert.deepStrictEqual(MetaStore.load(), {}, 'corrupted meta ignored');
assert.strictEqual(MetaStore.runCount(), 0, 'runCount falls back to 0');
localStorage.setItem('devlife_meta', '42');
assert.deepStrictEqual(MetaStore.load(), {}, 'non-object meta ignored');
MetaStore.recordRunComplete(null); // still writable after corruption
assert.strictEqual(MetaStore.runCount(), 1, 'meta usable after corruption fallback');
localStorage.removeItem('devlife_meta');
console.log('✓ meta store: corrupted data ignored, not fatal');

// --- Stock Up swap: explicit replaceIndex swaps the chosen slot ---
localStorage.setItem('devlife_meta', JSON.stringify({ totalRuns: 0, startingConsumables: ['coffee', 'focus'] }));
MetaStore.addCarriedConsumable('espresso', 0); // swap slot 0
assert.deepStrictEqual(MetaStore.carriedIds('startingConsumables'), ['espresso', 'focus'], 'swap replaces the chosen slot');
MetaStore.addCarriedConsumable('coffee', 1); // swap slot 1
assert.deepStrictEqual(MetaStore.carriedIds('startingConsumables'), ['espresso', 'coffee'], 'swap replaces slot 1');
MetaStore.addCarriedConsumable('matcha', 5); // out-of-range index falls back to recency order
assert.deepStrictEqual(MetaStore.carriedIds('startingConsumables'), ['coffee', 'matcha'], 'bad index falls back to recency order');
localStorage.removeItem('devlife_meta');
console.log('✓ Stock Up swap: explicit replaceIndex swaps the chosen slot');

// --- End-of-run options exclude carried consumables (a swap must be a real swap) ---
localStorage.setItem('devlife_meta', JSON.stringify({ totalRuns: 0, startingConsumables: ['coffee', 'focus'] }));
for (let i = 0; i < 20; i++) {
  const opts = ConsumableManager.getEndOfRunOptions();
  assert.strictEqual(opts.length, 3, '3 options offered');
  assert.ok(opts.every(c => !['coffee', 'focus'].includes(c.id)), 'carried consumables are not offered');
}
localStorage.removeItem('devlife_meta');
console.log('✓ end-of-run options exclude carried consumables');

// --- Consumable carry-over: the last 2 in the pool are granted ---
const conById = id => CONSUMABLES.find(c => c.id === id);
const conStats = { S: 10, P: 10, E: 10, C: 10, I: 10, A: 10, L: 10 };
const conRun3 = Game.createCharacter(conStats, ['coffee', 'focus', 'espresso'].map(conById), []);
assert.deepStrictEqual(conRun3.consumables.map(c => c.id), ['focus', 'espresso'], 'last 2 carried consumables granted');
const conRun1 = Game.createCharacter(conStats, ['coffee'].map(conById), []);
assert.deepStrictEqual(conRun1.consumables.map(c => c.id), ['coffee'], 'single carried consumable granted');
console.log('✓ consumable carry-over: last 2 in pool granted');

// --- Carry-over equipment: bonuses active from day 1 ---
SpecialSystem.init({ S: 5, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
const kb = EQUIPMENT.find(e => e.id === 'keyboard'); // +1 S
Game.createCharacter({ S: 5, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 }, [], [kb]);
assert.strictEqual(SpecialSystem.equipmentBonuses.S, 1, 'carry-over bonus applied at run start');
assert.strictEqual(SpecialSystem.effective('S'), 6, 'effective stat includes carry-over bonus');
SpecialSystem.init({ S: 5, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
Game.createCharacter({ S: 5, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 }, [], []);
assert.strictEqual(SpecialSystem.equipmentBonuses.S, 0, 'no phantom bonuses without equipment');
console.log('✓ carry-over equipment: bonuses active from day 1');

// --- Equipment carry-over: most recent equipment wins (issue #4) ---
localStorage.setItem('devlife_meta', JSON.stringify({ totalRuns: 0, startingEquipment: ['mech_keyboard'] }));
MetaStore.recordRunComplete('standing_desk'); // swapped mid-run; ended with the new item
assert.deepStrictEqual(MetaStore.carriedIds('startingEquipment'), ['standing_desk'], 'newest equipment replaces the carried one');
MetaStore.recordRunComplete('mech_keyboard'); // swapped back in a later run
assert.deepStrictEqual(MetaStore.carriedIds('startingEquipment'), ['mech_keyboard'], 'carries over again after swap-back');
MetaStore.recordRunComplete(null); // ended a run with no equipment
assert.deepStrictEqual(MetaStore.carriedIds('startingEquipment'), [], 'no equipment at run end clears carry-over');
assert.strictEqual(MetaStore.runCount(), 3, 'run counter still increments');
localStorage.removeItem('devlife_meta');
console.log('✓ equipment carry-over: most recent wins (issue #4)');

// --- Save schema: SaveData class validates the full shape ---
function validSave() {
  const stats = { S: 5, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 };
  return {
    state: { stats: { ...stats }, equipment: [], consumables: [], level: 1, day: 1, phase: 1, careerLog: [] },
    special: { stats: { ...stats }, equipmentBonuses: { S: 0, P: 0, E: 0, C: 0, I: 0, A: 0, L: 0 } },
    perks: { active: [], bruteForceUsed: false, codeReviewUsed: false, negotiateUsed: false, cleanDeployUsed: false },
    timestamp: 123
  };
}
assert.deepStrictEqual(SaveData.validate(validSave()), [], 'valid save passes the schema');
assert.deepStrictEqual(SaveData.validate(null), ['save is not an object'], 'null rejected');
assert.ok(SaveData.validate({}).includes('state is missing'), 'missing state reported');
const noSpecial = validSave(); delete noSpecial.special;
assert.ok(SaveData.validate(noSpecial).some(e => e.startsWith('special')), 'missing special reported');
const badPerk = validSave(); badPerk.perks.negotiateUsed = 'yes';
assert.ok(SaveData.validate(badPerk).some(e => e.includes('perks.negotiateUsed')), 'bad perk flag reported');
const badStat = validSave(); badStat.state.stats.S = 'high';
assert.ok(SaveData.validate(badStat).some(e => e.includes('state.stats.S')), 'bad stat type reported');
const multi = validSave(); delete multi.special; multi.state.level = 'one';
assert.ok(SaveData.validate(multi).length >= 2, 'all problems reported at once');
assert.ok(SaveData.parse(validSave()) instanceof SaveData, 'parse returns a SaveData instance');
assert.strictEqual(SaveData.parse({ nope: 1 }), null, 'parse returns null when invalid');

// SaveSystem round-trip through the schema
localStorage.setItem('devlife_save', JSON.stringify(validSave()));
const loaded = SaveSystem.load();
assert.ok(loaded instanceof SaveData, 'load returns a SaveData instance');
assert.strictEqual(/** @type {any} */ (Game.state).level, 1, 'game state restored');
localStorage.setItem('devlife_save', '{corrupt');
assert.strictEqual(SaveSystem.load(), null, 'corrupt JSON rejected');
localStorage.removeItem('devlife_save');
console.log('✓ save schema: SaveData class validation, reasons logged, load round-trip');

// --- Clean Deploy (auto-reroll, cleanDeployUsed flag) ---
freshRun({ S: 5, P: 5, E: 5, C: 5, I: 5, A: 5, L: 10 });
assert.ok(PerkSystem.has('clean_deploy'), 'L=10 activates Clean Deploy');
let rolls = [20, 1]; // first roll fails, reroll succeeds
d20 = () => rolls.shift();
const cdWin = Game.resolveStatChecks({ checks: { S: 5 } });
assert.strictEqual(cdWin.cleanDeployUsed, true, 'flag set when the reroll fires');
assert.strictEqual(cdWin.allSuccess, true, 'reroll saved the check');

freshRun({ S: 5, P: 5, E: 5, C: 5, I: 5, A: 5, L: 10 });
rolls = [20, 20]; // both rolls fail
d20 = () => rolls.shift();
const cdLose = Game.resolveStatChecks({ checks: { S: 5 } });
assert.strictEqual(cdLose.cleanDeployUsed, true, 'flag set even when the reroll fails');
assert.strictEqual(cdLose.allSuccess, false, 'failed reroll stays a failure');
console.log('✓ clean deploy: auto-reroll, flag reported for outcome toast');

// ============================================================
// Extended coverage
// ============================================================

// Earlier sections stubbed d20 — restore real rolls for range tests
d20 = () => dRoll(20);
const realRandom = Math.random;

// --- utils: dice ranges and career-year conversion ---
for (let i = 0; i < 1000; i++) {
  assert.ok(dRoll(6) >= 1 && dRoll(6) <= 6, 'dRoll(6) in [1,6]');
  assert.ok(d20() >= 1 && d20() <= 20, 'd20 in [1,20]');
}
assert.strictEqual(dayToCareerYear(1), 1, 'day 1 = year 1');
assert.strictEqual(dayToCareerYear(12), 1, 'day 12 = year 1');
assert.strictEqual(dayToCareerYear(13), 2, 'day 13 = year 2');
console.log('✓ utils: dice ranges, career year conversion');

// --- SpecialSystem: effective-stat math and lifecycle ---
freshRun({ S: 5, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
assert.strictEqual(SpecialSystem.effective('S'), 5, 'base only');
SpecialSystem.addEquipment('⌨️', { S: 2 });
assert.strictEqual(SpecialSystem.effective('S'), 7, 'base + equipment');
SpecialSystem.applyTempBonus('S', 1);
assert.strictEqual(SpecialSystem.effective('S'), 8, 'base + equipment + temp');
SpecialSystem.applyMultiplier(1.5);
assert.strictEqual(SpecialSystem.effective('S'), 12, 'multiplier applies to the sum');
SpecialSystem.clearTempBonuses();
assert.strictEqual(SpecialSystem.effective('S'), 7, 'temp bonus and multiplier cleared');
SpecialSystem.removeEquipment('⌨️', { S: 2 });
assert.strictEqual(SpecialSystem.effective('S'), 5, 'equipment bonus removed');
assert.ok(SpecialSystem.canIncrease('S'), 'can increase below max');
SpecialSystem.stats.S = 10;
assert.ok(!SpecialSystem.canIncrease('S'), 'cannot increase at max');
assert.strictEqual(SpecialSystem.increase('S'), false, 'increase rejected at max');
assert.strictEqual(SpecialSystem.stats.S, 10, 'stat unchanged after rejected increase');
console.log('✓ special: effective stat math, temp/multiplier lifecycle, max clamping');

// --- resolveStatChecks: roll math, Luck, competence gate, multi-check ---
freshRun({ S: 10, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
d20 = () => 1; // 1 - 5 = -4
let cr = Game.resolveStatChecks({ checks: { S: 5 } });
assert.strictEqual(cr.allSuccess, true, 'low roll passes');
d20 = () => 20; // 20 - 5 = 15
cr = Game.resolveStatChecks({ checks: { S: 5 } });
assert.strictEqual(cr.allSuccess, false, 'high roll fails');
assert.strictEqual(cr.results[0].roll, 15, 'Luck subtracts from the roll');
// Competence gate: the roll passes but the effective stat is too low
freshRun({ S: 1, P: 5, E: 5, C: 5, I: 5, A: 5, L: 1 });
d20 = () => 2; // roll 1 <= 5 — the roll itself passes
cr = Game.resolveStatChecks({ checks: { S: 5 } });
assert.strictEqual(cr.allSuccess, false, 'competence gate fails despite passing roll');
// Multiple checks: one failure fails the whole choice
freshRun({ S: 10, P: 1, E: 5, C: 5, I: 5, A: 5, L: 1 });
d20 = () => 3; // roll 2: S (target 5) passes, P (target 1) fails
cr = Game.resolveStatChecks({ checks: { S: 5, P: 1 } });
assert.strictEqual(cr.allSuccess, false, 'one failed check fails the choice');
assert.strictEqual(cr.results[0].success, true, 'S check passed');
assert.strictEqual(cr.results[1].success, false, 'P check failed');
console.log('✓ resolveStatChecks: roll math, Luck subtraction, competence gate, multi-check');

// --- applyEffects: clamping at stat bounds ---
freshRun({ S: 10, P: 1, E: 5, C: 5, I: 5, A: 5, L: 5 });
Game.applyEffects({ S: 5 });
assert.strictEqual(SpecialSystem.stats.S, 10, 'positive effect clamps at max');
Game.applyEffects({ P: -5 });
assert.strictEqual(SpecialSystem.stats.P, 1, 'negative effect clamps at min');
assert.strictEqual(Game.applyEffects({ E: -2 }).hasNegativeEffects, true, 'negative effects flagged');
assert.strictEqual(Game.applyEffects({ E: 2 }).hasNegativeEffects, false, 'positive effects not flagged');
console.log('✓ applyEffects: clamping at min/max, hasNegativeEffects flag');

// --- checkLevelUp: cadence, Rapid Learner, Fast Ship ---
freshRun({ S: 5, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
Game.state.level = 1;
Game.state.levelUpPoints = 0;
Game.state.eventsCompleted = 5;
assert.strictEqual(Game.checkLevelUp(), false, 'no level up before threshold');
Game.state.eventsCompleted = 6; // level 1 * 6 events
assert.strictEqual(Game.checkLevelUp(), true, 'level up at threshold');
assert.strictEqual(Game.state.level, 2, 'level incremented');
assert.strictEqual(Game.state.levelUpPoints, 1, 'one point granted');
assert.strictEqual(Game.state.pendingLevelUpConsumables.length, 3, 'level-up consumable options generated');
// Rapid Learner grants 2 points
freshRun({ S: 5, P: 5, E: 5, C: 5, I: 10, A: 5, L: 5 });
Game.state.level = 1;
Game.state.levelUpPoints = 0;
Game.state.eventsCompleted = 6;
assert.strictEqual(Game.checkLevelUp(), true, 'level up (Rapid Learner build)');
assert.strictEqual(Game.state.levelUpPoints, 2, 'Rapid Learner bonus point');
// Fast Ship shortens the cadence to 5
freshRun({ S: 5, P: 5, E: 5, C: 5, I: 5, A: 10, L: 5 });
Game.state.level = 1;
Game.state.levelUpPoints = 0;
Game.state.eventsCompleted = 5;
assert.strictEqual(Game.checkLevelUp(), true, 'Fast Ship: level up after 5 events');
console.log('✓ checkLevelUp: threshold cadence, Rapid Learner, Fast Ship');

// --- checkForEquipmentDrop: rate roll, inventory fill, pending drop ---
freshRun({ S: 5, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
Game.state.equipment = [];
Math.random = () => 0.99; // above drop rate (0.15 + 5*0.03 = 0.30)
assert.strictEqual(Game.checkForEquipmentDrop(true), null, 'no drop on high roll');
Math.random = () => 0.01; // below drop rate → common rarity, first item
const dropped = Game.checkForEquipmentDrop(true);
assert.ok(dropped, 'drop on low roll');
assert.strictEqual(dropped.id, 'keyboard', 'deterministic rarity pick');
assert.strictEqual(Game.state.equipment.length, 1, 'added to inventory');
assert.strictEqual(SpecialSystem.equipmentBonuses.S, 1, 'drop bonus applied');
// Inventory full → held as a pending drop for the player to resolve
Math.random = () => 0.01;
assert.strictEqual(Game.checkForEquipmentDrop(true), null, 'nothing auto-added when inventory full');
assert.ok(Game.state.pendingEquipmentDrop, 'pending drop flagged for player choice');
Math.random = realRandom;
console.log('✓ checkForEquipmentDrop: rate roll, inventory fill, pending drop');

// --- ConsumableManager: use, removal, AI backfire threshold ---
freshRun({ S: 5, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
const coffee = CONSUMABLES.find(c => c.id === 'coffee');
const ai = CONSUMABLES.find(c => c.id === 'ai_copilot');
Game.state.consumables = [coffee, ai];
const used = ConsumableManager.use('coffee');
assert.strictEqual(used.bonus, 2, 'bonus reported');
assert.strictEqual(used.stat, 'E', 'stat reported');
assert.strictEqual(Game.state.consumables.length, 1, 'consumed item removed from inventory');
assert.strictEqual(ConsumableManager.use('nope'), null, 'unknown id returns null');
Math.random = () => 0.5; // 0.5 > 0.30 → AI works
const aiOk = ConsumableManager.use('ai_copilot');
assert.strictEqual(aiOk.multiplier, 1.5, 'AI multiplier applied');
assert.strictEqual(aiOk.backfired, false, 'no backfire above threshold');
Math.random = () => 0.2; // 0.2 <= 0.30 → backfire
Game.state.consumables = [ai];
const aiBad = ConsumableManager.use('ai_copilot');
assert.strictEqual(aiBad.multiplier, -0.5, 'backfire penalty multiplier');
assert.strictEqual(aiBad.backfired, true, 'backfire flagged');
Math.random = realRandom;
console.log('✓ consumables: use/removal, unknown id, AI backfire threshold');

// --- Item pools: rarity weighting and unique random consumables ---
Math.random = () => 0.01;
assert.strictEqual(getRandomEquipment().id, 'keyboard', 'low roll → common (first in pool)');
Math.random = () => 0.99;
assert.strictEqual(getRandomEquipment().id, 'homeoffice', 'high roll → epic (last in pool)');
const three = get3RandomConsumables();
assert.strictEqual(three.length, 3, '3 random consumables');
assert.strictEqual(new Set(three.map(c => c.id)).size, 3, 'no duplicates');
Math.random = realRandom;
console.log('✓ item pools: rarity weighting, unique random consumables');

// --- Game over: saving roll and probabilistic redundancy ---
freshRun({ S: 1, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
// Saving roll target = L + 0.5*C = 5 + 2.5 = 7.5
d20 = () => 7;
assert.strictEqual(Game._checkDeterministicGameOver(), null, 'saving roll success survives');
assert.strictEqual(SpecialSystem.stats.S, 2, 'floored stat clawed back to 2');
freshRun({ S: 1, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
d20 = () => 8;
const death = Game._checkDeterministicGameOver();
assert.ok(death && death.reason.includes('Technical Collapse'), 'saving roll failure ends the run');
// Probabilistic redundancy: phase >= 3, C <= 2, day > 400, risk = (3-C)*0.15
freshRun({ S: 5, P: 5, E: 5, C: 1, I: 5, A: 5, L: 5 });
Game.state.phase = 3;
Game.state.day = 500;
Math.random = () => 0.1; // 0.1 < 0.30 risk → redundant
const red = Game._checkProbabilisticGameOver();
assert.ok(red && red.reason.includes('Redundant'), 'redundancy death fires under risk');
Math.random = () => 0.9; // 0.9 > 0.30 → survives
assert.strictEqual(Game._checkProbabilisticGameOver(), null, 'redundancy roll can miss');
Math.random = realRandom;
console.log('✓ game over: saving roll survive/death, redundancy risk');

// --- dangerStats: one hit from the saving-roll floor ---
freshRun({ S: 2, P: 3, E: 2, C: 5, I: 5, A: 5, L: 5 });
assert.deepStrictEqual(Game.dangerStats(), ['S', 'E'], 'warns at 2, not at 3');
SpecialSystem.equipmentBonuses.S = 5; // effective 7 — the floor doesn't care
assert.deepStrictEqual(Game.dangerStats(), ['S', 'E'], 'equipment does not suppress the warning');
SpecialSystem.equipmentBonuses = zeroStats();
SpecialSystem.stats.S = 3;
assert.deepStrictEqual(Game.dangerStats(), ['E'], 'recovered stat drops off');
SpecialSystem.stats.E = 3;
assert.deepStrictEqual(Game.dangerStats(), [], 'no danger when all stats are safe');
console.log('✓ dangerStats: base stats at the threshold, equipment irrelevant');

// --- Backpack: +1 consumable slot while carried ---
const backpack = EQUIPMENT.find(e => e.id === 'backpack');
assert.ok(backpack, 'backpack is in the equipment pool');
assert.strictEqual(equipmentEffectText(backpack), '+1 consumable slot', 'effect text shows the slot bonus');
assert.strictEqual(equipmentEffectText(EQUIPMENT.find(e => e.id === 'keyboard')), '+1 Strength', 'stat-only equipment unchanged');
fullRun({ S: 5, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
assert.strictEqual(Game.consumableCap(), 2, 'base cap without equipment');
Game.state.equipment = [backpack];
assert.strictEqual(Game.consumableCap(), 3, 'backpack raises the cap');
Game.state.equipment = [EQUIPMENT.find(e => e.id === 'keyboard')];
assert.strictEqual(Game.consumableCap(), 2, 'stat equipment does not');
// A new run grants the extra slot from the carried backpack
const stash = [CONSUMABLES[0], CONSUMABLES[1], CONSUMABLES[2]];
const withPack = Game.createCharacter(zeroStats(), stash, [backpack]);
assert.strictEqual(withPack.consumables.length, 3, '3 starting consumables with backpack');
const noPack = Game.createCharacter(zeroStats(), stash, []);
assert.strictEqual(noPack.consumables.length, 2, '2 without');
console.log('✓ backpack: +1 consumable slot, granted at run start');

// --- Phase progression: completion vs victory ---
freshRun({ S: 5, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
Game.state.phase = 3;
Game.state.bossCompleted = true;
assert.strictEqual(Game.checkPhaseCompletion(), true, 'phase 3 boss → phase complete');
assert.strictEqual(Game.checkVictory(), false, 'phase 3 boss is not victory');
Game.state.phase = 4;
assert.strictEqual(Game.checkPhaseCompletion(), false, 'phase 4 has no next phase');
assert.strictEqual(Game.checkVictory(), true, 'phase 4 boss → victory');
console.log('✓ phase progression: completion vs victory');

// --- resolveChoice + applyChoice: full event processing (synthetic EVENTS) ---
EVENTS = [
  {
    id: 'test_event', title: 'Test Event', phase: 1, phaseLabel: 'Test', narrative: 'n',
    choices: [{
      text: 'Try', checks: { S: 5 },
      success: { text: 's', effects: { S: 1 }, log: 'won' },
      failure: { text: 'f', effects: { S: -1 }, log: 'lost' }
    }]
  },
  {
    id: 'test_boss', title: 'BOSS: The Deadline', phase: 1, phaseLabel: 'Test', narrative: 'n',
    choices: [{
      text: 'Fight', checks: {},
      success: { text: 's', effects: {}, log: 'boss down' },
      failure: { text: 'f', effects: {}, log: 'boss wins' }
    }]
  }
];
fullRun({ S: 10, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
Math.random = () => 0.99; // no equipment drops during this section
d20 = () => 1; // roll -4 vs target 5 → success
let pr = Game.applyChoice(Game.resolveChoice(EVENTS[0], 0));
assert.strictEqual(pr.success, true, 'choice succeeded');
assert.strictEqual(pr.equipmentDropped, false, 'no stale pending drop reported');
assert.strictEqual(SpecialSystem.stats.S, 10, 'success effect clamped at max');
assert.ok(Game.state.day > 1, 'day advanced');
assert.strictEqual(Game.state.eventsCompleted, 1, 'event counted');
assert.strictEqual(Game.state.currentEventId, 'test_event', 'current event tracked');
assert.deepStrictEqual(Game.state.eventHistory, ['test_event'], 'history appended');
assert.strictEqual(Game.state.careerLog[0].message, 'won', 'success log entry');
d20 = () => 20; // roll 15 vs target 5 → failure
pr = Game.applyChoice(Game.resolveChoice(EVENTS[0], 0));
assert.strictEqual(pr.success, false, 'choice failed');
assert.strictEqual(SpecialSystem.stats.S, 9, 'failure effect applied');
assert.strictEqual(Game.state.careerLog[0].message, 'lost', 'failure log entry');
pr = Game.applyChoice(Game.resolveChoice(EVENTS[1], 0));
assert.strictEqual(pr.bossDefeated, true, 'BOSS: prefix detected');
assert.strictEqual(Game.state.bossCompleted, true, 'boss flag set');
assert.strictEqual(pr.phaseComplete, true, 'phase 1 boss → phase complete');
assert.ok(Game.resolveChoice({ id: 'nope' }, 0).error, 'unknown event → error result');
assert.ok(Game.resolveChoice(EVENTS[0], 5).error, 'bad choice index → error result');
Math.random = realRandom;
console.log('✓ resolve/apply: success/failure paths, boss detection, day/history, error paths');

// --- Boss event + run end: terminal flags co-occur (toast clobber guard) ---
// applyChoice sets bossDefeated from the event title alone, so a run
// that ENDS on a boss event reports bossDefeated AND gameOver (AND
// leveledUp, if the event count lines up). handleChoice must toast
// terminal states FIRST (gameOver → victory → ...) or the death toast is
// clobbered by a celebration — regression guard for that ordering.
EVENTS = [
  {
    id: 'test_boss_death', title: 'BOSS: The Meltdown', phase: 1, phaseLabel: 'Test', narrative: 'n',
    choices: [{
      text: 'Fight', checks: { S: 1 },
      success: { text: 's', effects: {}, log: 'boss down' },
      failure: { text: 'f', effects: {}, log: 'boss wins' }
    }]
  }
];
// S on the floor; saving roll target = L + 0.5*C = 3.5, roll 20 → death
freshRun({ S: 1, P: 5, E: 5, C: 5, I: 5, A: 5, L: 1 });
Object.assign(Game.state, {
  level: 1, levelUpPoints: 0, phase: 1, eventsCompleted: 5,
  equipment: [], consumables: [], eventHistory: [],
  bossCompleted: false, currentEventId: null, pendingEquipmentDrop: null
});
Math.random = () => 0.99; // no equipment drops
d20 = () => 20; // check: 19 vs 1 → fail; saving roll: 20 vs 3.5 → fail
pr = Game.applyChoice(Game.resolveChoice(EVENTS[0], 0));
assert.strictEqual(pr.success, false, 'boss check failed');
assert.strictEqual(pr.bossDefeated, true, 'bossDefeated set regardless of outcome');
assert.ok(pr.gameOver, 'run ended on the boss event');
assert.strictEqual(pr.leveledUp, true, 'level up also fires (6th event)');
// All three of leveledUp/bossDefeated/gameOver true in one result — the
// state that exercises the terminal-first toast ordering in handleChoice.
Math.random = realRandom;
console.log('✓ boss + game over: terminal state co-occurs with leveledUp/bossDefeated (toast ordering guard)');

// --- Game.nextEvent: event picking and phase advancement ---
EVENTS = [
  { id: 'p1a', title: 'P1 A', phase: 1, phaseLabel: 'Jr', narrative: 'n',
    choices: [{ text: 'x', checks: {}, success: { text: 's', effects: {}, log: 's' }, failure: { text: 'f', effects: {}, log: 'f' } }] },
  { id: 'p1b', title: 'P1 B', phase: 1, phaseLabel: 'Jr', narrative: 'n',
    choices: [{ text: 'x', checks: {}, success: { text: 's', effects: {}, log: 's' }, failure: { text: 'f', effects: {}, log: 'f' } }] },
  { id: 'p1boss', title: 'BOSS: One', phase: 1, phaseLabel: 'Jr', narrative: 'n',
    choices: [{ text: 'x', checks: {}, success: { text: 's', effects: {}, log: 's' }, failure: { text: 'f', effects: {}, log: 'f' } }] },
  { id: 'p2a', title: 'P2 A', phase: 2, phaseLabel: 'Mid', narrative: 'n',
    choices: [{ text: 'x', checks: {}, success: { text: 's', effects: {}, log: 's' }, failure: { text: 'f', effects: {}, log: 'f' } }] },
  { id: 'p2boss', title: 'BOSS: Two', phase: 2, phaseLabel: 'Mid', narrative: 'n',
    choices: [{ text: 'x', checks: {}, success: { text: 's', effects: {}, log: 's' }, failure: { text: 'f', effects: {}, log: 'f' } }] }
];
freshRun({ S: 5, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
Object.assign(Game.state, {
  level: 1, levelUpPoints: 0, phase: 1, eventsCompleted: 0,
  equipment: [], consumables: [], eventHistory: [],
  bossCompleted: false, currentEventId: null, pendingEquipmentDrop: null
});
let ne = Game.nextEvent();
assert.ok(['p1a', 'p1b'].includes(ne.id), 'first event of cycle is a non-boss');
Game.state.eventsCompleted = 5; // 6th event of the cycle
assert.strictEqual(Game.nextEvent().id, 'p1boss', 'boss on the cycle boundary');
Game.state.eventsCompleted = 0;
Game.state.eventHistory = ['p1a', 'p1b'];
assert.strictEqual(Game.nextEvent().id, 'p1boss', 'all non-boss events seen → boss fallback');
Game.state.eventHistory = [];
Game.state.eventsCompleted = 6; // past the boundary → non-boss cadence
Game.state.bossCompleted = true;
ne = Game.nextEvent();
assert.strictEqual(Game.state.phase, 2, 'defeated boss advances the phase');
assert.strictEqual(ne.id, 'p2a', 'next event picked from the new phase');
assert.ok(Game.state.careerLog[0].message.includes('Promoted'), 'promotion logged');
console.log('✓ Game.nextEvent: non-boss cadence, boss cycle, exclusion fallback, phase advancement');

// --- utils: zeroStats, clampStat, formatEffects, Fisher-Yates shuffle ---
const zs = zeroStats();
assert.deepStrictEqual(Object.keys(zs).sort(), ['A', 'C', 'E', 'I', 'L', 'P', 'S'], 'zeroStats: all seven stats');
assert.ok(Object.values(zs).every(v => v === 0), 'zeroStats: all values zero');
assert.notStrictEqual(zeroStats(), zs, 'zeroStats: fresh object each call');
assert.strictEqual(clampStat(5), 5, 'clampStat: in-range unchanged');
assert.strictEqual(clampStat(99), CONFIG.stats.max, 'clampStat: caps at max');
assert.strictEqual(clampStat(-99), CONFIG.stats.min, 'clampStat: floors at min');
assert.strictEqual(
  formatEffects({ S: 2, C: 1 }),
  `+2 ${STAT_META.S.name}, +1 ${STAT_META.C.name}`,
  'formatEffects: named stats, comma-joined'
);
const input = [1, 2, 3, 4, 5];
const sh = shuffle(input);
assert.deepStrictEqual([...sh].sort((a, b) => a - b), input, 'shuffle: permutation of input');
assert.deepStrictEqual(input, [1, 2, 3, 4, 5], 'shuffle: input not mutated');
assert.deepStrictEqual(shuffle([]), [], 'shuffle: empty array');
console.log('✓ utils: zeroStats, clampStat, formatEffects, Fisher-Yates shuffle');
