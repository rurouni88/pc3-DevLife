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

// Shared SVG symbol definitions for use via <use href="#icon-*">.
// Injected into the DOM once on init by initSvgAssets().
const SVG_SYMBOLS = `
  <symbol id="icon-bar-chart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="12" width="4" height="9" rx="1"/>
    <rect x="10" y="6" width="4" height="15" rx="1"/>
    <rect x="17" y="3" width="4" height="18" rx="1"/>
  </symbol>
  <symbol id="icon-padlock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </symbol>
  <symbol id="icon-trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/>
    <path d="M8 6H5a1 1 0 0 0-1 1v1a4 4 0 0 0 4 4"/>
    <path d="M16 6h3a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4"/>
    <path d="M12 13v4"/>
    <path d="M8 20h8"/>
    <path d="M9 17h6"/>
  </symbol>
  <symbol id="icon-dice" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="3" y="3" width="18" height="18" rx="3"/>
    <circle cx="8" cy="8" r="1.5"/>
    <circle cx="16" cy="8" r="1.5"/>
    <circle cx="8" cy="16" r="1.5"/>
    <circle cx="16" cy="16" r="1.5"/>
    <circle cx="12" cy="12" r="1.5"/>
  </symbol>
  <symbol id="icon-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
  </symbol>
  <symbol id="icon-reset" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </symbol>
  <symbol id="icon-save" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </symbol>
`;

// Inject shared SVG symbols into the DOM so <use href="#icon-*"> works.
function initSvgAssets(): void {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.display = 'none';
  svg.innerHTML = SVG_SYMBOLS;
  document.body.appendChild(svg);
}
