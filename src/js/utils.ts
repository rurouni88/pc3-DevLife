// utils.ts — shared helpers (dice rolls)

// Generic n-sided die: returns a random integer in [1, sides].
// Uses RngEngine so that seeded runs reproduce the same rolls.
function dRoll(sides: number): number {
  return RngEngine.dRoll(sides);
}

// 20-sided die — stat checks and saving rolls.
function d20(): number { return dRoll(20); }

// Convert in-game days to career years (12 days = 1 career year).
function dayToCareerYear(day: number): number {
  return Math.ceil(day / CONFIG.game.daysPerCareerYear);
}

// A fresh zeroed stat object — single home for the Stats shape.
function zeroStats(): Stats {
  return { S: 0, P: 0, E: 0, C: 0, I: 0, A: 0, L: 0 };
}

// Fisher-Yates shuffle: returns a new uniformly shuffled array,
// leaving the input untouched. Uses RngEngine so that seeded runs
// reproduce the same orderings. (sort(() => Math.random() - 0.5) is
// biased and mutates; this is neither.)
function shuffle<T>(arr: T[]): T[] {
  return RngEngine.shuffle(arr);
}

// Clamp a value into the stat range from CONFIG.
function clampStat(value: number): number {
  return Math.max(CONFIG.stats.min, Math.min(CONFIG.stats.max, value));
}

// Human-readable effect string: { S: 2, C: 1 } → "+2 Strength, +1 Craft".
// STAT_META (archetypes.js) is resolved at call time, after load.
function formatEffects(effects: Partial<Stats>): string {
  return Object.entries(effects)
    .map(([stat, value]) => `+${value} ${STAT_META[stat as StatKey]?.name || stat}`)
    .join(', ');
}

// Full effect text for an equipment item: stat bonuses + slot bonuses
// (the Backpack has no stat effects, only a slot bonus). Uses the signed
// formatter so multi-stat consumables (alcohol) sharing this path — the
// item tooltip — render their negative deltas correctly; equipment deltas
// are all positive, so its output is unchanged.
function equipmentEffectText(item: { effects?: Partial<Stats>; consumableSlots?: number }): string {
  const parts: string[] = [];
  if (item.effects && Object.keys(item.effects).length > 0) parts.push(formatSignedEffects(item.effects));
  if (item.consumableSlots) parts.push(`+${item.consumableSlots} consumable slot`);
  return parts.join(', ');
}

// Signed effect string for multi-stat consumables (alcohol): { E: 2, P: -1 }
// → "+2 Endurance, -1 Perception". formatEffects() hardcodes "+" and is for
// equipment, where every delta is positive.
function formatSignedEffects(effects: Partial<Stats>): string {
  return Object.entries(effects)
    .map(([stat, value]) => `${value >= 0 ? '+' : '-'}${Math.abs(value)} ${STAT_META[stat as StatKey]?.name || stat}`)
    .join(', ');
}
