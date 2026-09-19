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
