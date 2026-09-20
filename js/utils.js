// utils.js — shared helpers (dice rolls)

// Generic n-sided die: returns a random integer in [1, sides].
/** @param {number} sides @returns {number} */
function dRoll(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

// 20-sided die — stat checks and saving rolls.
function d20() { return dRoll(20); }

// Convert in-game days to career years (12 days = 1 career year).
/** @param {number} day @returns {number} */
function dayToCareerYear(day) {
  return Math.ceil(day / CONFIG.game.daysPerCareerYear);
}

// A fresh zeroed stat object — single home for the Stats shape.
/** @returns {Stats} */
function zeroStats() {
  return { S: 0, P: 0, E: 0, C: 0, I: 0, A: 0, L: 0 };
}

// Fisher-Yates shuffle: returns a new uniformly shuffled array,
// leaving the input untouched. (sort(() => Math.random() - 0.5) is
// biased and mutates; this is neither.)
/** @template T @param {T[]} arr @returns {T[]} */
function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Clamp a value into the stat range from CONFIG.
/** @param {number} value @returns {number} */
function clampStat(value) {
  return Math.max(CONFIG.stats.min, Math.min(CONFIG.stats.max, value));
}

// Human-readable effect string: { S: 2, C: 1 } → "+2 Strength, +1 Craft".
// STAT_META (archetypes.js) is resolved at call time, after load.
/** @param {Partial<Stats>} effects @returns {string} */
function formatEffects(effects) {
  return Object.entries(effects)
    .map(([stat, value]) => `+${value} ${STAT_META[/** @type {StatKey} */ (stat)]?.name || stat}`)
    .join(', ');
}

