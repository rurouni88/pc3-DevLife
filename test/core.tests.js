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

// --- Phase names: single source in CONFIG ---
assert.strictEqual(CONFIG.game.phaseNames.length, 5, 'phase names indexed 0-4');
freshRun({ S: 5, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
Game.state.phase = 1;
Game.advancePhase();
assert.strictEqual(Game.state.phase, 2, 'phase advanced');
assert.ok(Game.state.careerLog[0].message.includes('Mid-Level Developer'), 'promotion log uses CONFIG phase name');
console.log('✓ phase names: single CONFIG source, promotion log correct');

// --- Perk activation: stats at 10 unlock, dropping below revokes ---
freshRun({ S: 10, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
assert.ok(PerkSystem.has('brute_force'), 'S=10 activates Brute Force');
SpecialSystem.stats.S = 9;
PerkSystem.refresh();
assert.ok(!PerkSystem.has('brute_force'), 'S=9 revokes Brute Force');
console.log('✓ perk activation: unlock at 10, revoke below');

// --- Code Review (active, once per run) ---
freshRun({ S: 5, P: 10, E: 5, C: 5, I: 5, A: 5, L: 5 });
assert.ok(PerkSystem.has('code_review'), 'P=10 activates Code Review');
const crResult = { effects: { E: -4 } };
Game.applyEffects(crResult.effects);
assert.strictEqual(SpecialSystem.stats.E, 1, 'full -4 applied before player choice');
assert.ok(PerkSystem.canUseCodeReview(), 'perk still available on the result screen');
assert.ok(Game.useCodeReview(crResult), 'useCodeReview succeeds');
assert.strictEqual(SpecialSystem.stats.E, 3, 'negative effect halved retroactively');
assert.ok(PerkSystem.codeReviewUsed, 'perk consumed');
assert.ok(!Game.useCodeReview(crResult), 'second use rejected');
assert.strictEqual(SpecialSystem.stats.E, 3, 'no double correction');
console.log('✓ code review: active prompt, halves once, consumed');

// --- Negotiate (mutates the result) ---
freshRun({ S: 5, P: 5, E: 5, C: 10, I: 5, A: 5, L: 5 });
const nResult = { success: false, checkResults: [{ stat: 'C', roll: 9, target: 5, effective: 5, success: false }] };
assert.ok(Game.useNegotiate(nResult), 'useNegotiate succeeds');
assert.strictEqual(nResult.success, true, 'result flips to success');
assert.strictEqual(nResult.checkResults[0].negotiated, true, 'check marked negotiated');
assert.ok(!Game.useNegotiate(nResult), 'second use rejected');
console.log('✓ negotiate: flips result, consumed');

// --- Brute Force (re-evaluates a failed Strength check) ---
freshRun({ S: 10, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
const bfWin = { success: false, checkResults: [{ stat: 'S', roll: 7, target: 5, effective: 5, success: false }] };
assert.ok(Game.useBruteForce(bfWin), 'useBruteForce succeeds');
assert.strictEqual(bfWin.checkResults[0].target, 7, 'target +2');
assert.strictEqual(bfWin.success, true, 'roll 7 vs 7 flips to success');

freshRun({ S: 10, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
const bfLose = { success: false, checkResults: [{ stat: 'S', roll: 8, target: 3, effective: 5, success: false }] };
assert.ok(Game.useBruteForce(bfLose), 'useBruteForce succeeds (fresh run)');
assert.strictEqual(bfLose.checkResults[0].target, 5, 'target +2');
assert.strictEqual(bfLose.success, false, 'roll 8 vs 5 still fails');
assert.ok(!Game.useBruteForce({ success: false, checkResults: [] }), 'third use rejected (once per run)');
console.log('✓ brute force: +2 target, flips when it saves, consumed');

// --- Grace: the failure's own effects may revoke the perk, but the
//     intervention was earned when the check resolved, so it still fires ---

// Negotiate: C=10, failed C check, failure effect C-2 revokes the perk
freshRun({ S: 5, P: 5, E: 5, C: 10, I: 5, A: 5, L: 5 });
d20 = () => 20; // fail the C check
const graceNCheck = Game.resolveStatChecks({ checks: { C: 1 } });
assert.ok(graceNCheck.hasNegotiate, 'prompt offered while perk active at roll time');
Game.applyEffects({ C: -2 }); // failure effect drops C to 8 → perk revoked
assert.ok(!PerkSystem.has('negotiate'), 'negotiate revoked by the failure effect');
const graceN = { success: false, checkResults: graceNCheck.results };
assert.ok(Game.useNegotiate(graceN), 'intervention still fires (earned at roll time)');
assert.strictEqual(graceN.success, true, 'result flips to success');

// Code Review: P=10, effects P-2/E-4 revoke the perk, halving still applies
freshRun({ S: 5, P: 10, E: 5, C: 5, I: 5, A: 5, L: 5 });
const graceCR = { effects: { P: -2, E: -4 } };
Game.applyEffects(graceCR.effects); // P: 10→8 (perk revoked), E: 5→1
assert.ok(!PerkSystem.has('code_review'), 'code review revoked by the failure effects');
assert.ok(Game.useCodeReview(graceCR), 'halving still fires');
assert.strictEqual(SpecialSystem.stats.P, 9, 'P corrected to the halved outcome (10-1)');
assert.strictEqual(SpecialSystem.stats.E, 3, 'E corrected to the halved outcome (5-2)');

// Brute Force: S=10, failed S check, effect S-2 revokes the perk, +2 still applies
freshRun({ S: 10, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 });
d20 = () => 20; // fail the S check
const graceBFCheck = Game.resolveStatChecks({ checks: { S: 1 } });
assert.ok(graceBFCheck.hasBruteForce, 'prompt offered while perk active at roll time');
Game.applyEffects({ S: -2 }); // S: 10→8 → perk revoked
assert.ok(!PerkSystem.has('brute_force'), 'brute force revoked by the failure effect');
const graceBF = { success: false, checkResults: graceBFCheck.results };
assert.ok(Game.useBruteForce(graceBF), '+2 still fires');
assert.strictEqual(graceBF.checkResults[0].target, 3, 'target +2 applied');
console.log('✓ grace: perk revoked by the failure itself can still intervene');

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
