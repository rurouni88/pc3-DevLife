// Shared type definitions for the d20().devLife codebase.
// This file contains type declarations only — no runtime code. It is picked up
// by the TypeScript compiler (tsconfig "include") and intentionally NOT loaded
// as a <script> in index.html; it compiles to an empty module.

import type { RngSnapshot } from './seeded-rng.js';

/** A single SPECIAL stat letter. */
export type StatKey = 'S' | 'P' | 'E' | 'C' | 'I' | 'A' | 'L';

/** All seven base stats. */
export type Stats = Record<StatKey, number>;

/** Item rarity tiers (see RARITY_WEIGHTS in items.js). */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic';

/** Career difficulty. Fixed at run start — no mid-run changes. */
export type Difficulty = 'easy' | 'normal' | 'hard';

/** Equipment — passive item with permanent stat bonuses and/or slot bonuses. */
export interface Equipment {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  effects: Partial<Stats>;
  desc: string;
  /** Bonus consumable slots while carried. */
  consumableSlots?: number;
}

/**
 * Consumable — one-time use stat boost (or risky multiplier).
 *
 * Three mutually exclusive effect shapes:
 *  - `stat` + `bonus`: a single-stat (or 'any') temp bonus on the next check
 *  - `multiplier`: a risky stat multiplier (AI tools)
 *  - `effects`: multiple stat deltas at once, negatives allowed (alcohol —
 *    e.g. Beer is +2 Endurance, -1 Perception, -1 Agility)
 */
export interface Consumable {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  stat?: StatKey | 'any';
  bonus?: number;
  multiplier?: number;
  effects?: Partial<Stats>;
  desc: string;
}

/** Result of using a consumable (multiplier fields only for AI tools). */
export interface ConsumableUseResult {
  id: string;
  name: string;
  emoji: string;
  stat?: StatKey | 'any';
  bonus?: number;
  multiplier?: number;
  effects?: Partial<Stats>;
  effective?: string;
  backfired?: boolean;
}

/** The outcome of a choice branch (success or failure). */
export interface EventOutcome {
  text: string;
  effects: Partial<Stats>;
  log: string;
}

/** A player choice within an event. */
export interface EventChoice {
  text: string;
  checks?: Partial<Record<StatKey, number>>;
  success: EventOutcome;
  failure: EventOutcome;
}

/** A game event as defined in data/events/phase_*.json. */
export interface GameEvent {
  id: string;
  title: string;
  phase: number;
  phaseLabel: string;
  narrative: string;
  choices: EventChoice[];
}

/** The result of a single stat check roll. */
export interface CheckResult {
  stat: StatKey;
  roll: number;
  // The unmodified d20 face (1-20). `roll` is Luck-adjusted (d20 - L) and can
  // go negative; the dice animation shows the real die, so it uses rawRoll.
  rawRoll: number;
  target: number;
  effective: number;
  success: boolean;
  negotiated?: boolean;
}

/** Which perk interventions are available for a resolved choice. */
export interface PerkInterventions {
  negotiate: boolean;
  bruteForce: boolean;
  codeReview: boolean;
}

/** Phase 1 of choice processing (Game.resolveChoice): the stat checks are
 * resolved and the available perk interventions determined, but NOTHING is
 * applied yet — effects, loot, days, and milestones all happen in
 * Game.applyChoice, after the player has decided. */
export interface ResolvedChoice {
  gameEvent: GameEvent;
  choice: EventChoice;
  isBoss: boolean;
  checkResults: CheckResult[];
  allSuccess: boolean;
  cleanDeployUsed: boolean;
  interventions: PerkInterventions;
}

/** The player's decisions on the available interventions (applyChoice input). */
export type PerkDecisions = PerkInterventions;

/** The return value of Game.applyChoice (the final, applied outcome).
 * On failure (no active run) only `error` is set.
 * `gameOver` is the death reason object, or null when the run continues. */
export interface ProcessResult {
  error?: string;
  success?: boolean;
  checkResults?: CheckResult[];
  effects?: Partial<Stats>;
  log?: string;
  itemDropped?: Equipment | null;
  equipmentDropped?: boolean;
  leveledUp?: boolean;
  gameOver?: { reason: string } | null;
  phaseComplete?: boolean;
  victory?: boolean;
  bossDefeated?: boolean;
  cleanDeployUsed?: boolean;
  ironNervesUsed?: boolean;
  // Perks gained/lost by this choice's effects — the UI announces these.
  perkChanges?: { gained: string[]; lost: string[] };
  // Achievements unlocked by this (run-ending) choice — the UI toasts these.
  newAchievements?: AchievementDefinition[];
}

/** A career log entry (most recent first). */
export interface CareerLogEntry {
  message: string;
  day: number;
  timestamp: number;
}

/** The full mutable game state (Game.state). */
export interface GameState {
  stats: Stats;
  equipment: Equipment[];
  consumables: Consumable[];
  difficulty: Difficulty;
  // The archetype the player started the run as (a key from ARCHETYPES, or
  // 'custom' for a non-matching build). Fixed at character creation.
  archetype: string;
  level: number;
  levelUpPoints: number;
  day: number;
  phase: number;
  eventsCompleted: number;
  // Number of consumables used this run (for the 'Consumer's Choice' achievement).
  consumablesUsed: number;
  currentEventId: string | null;
  eventHistory: string[];
  bossCompleted: boolean;
  careerLog: CareerLogEntry[];
  alive: boolean;
  won: boolean;
  startTime: number;
  runNumber: number;
  /** 8-char alphanumeric seed for this run (empty when unseeded). */
  seed: string;
  pendingLevelUpConsumables?: Consumable[] | null;
  pendingEquipmentDrop?: Equipment | null;
}

/** A predefined starting build (archetypes.js). */
export interface Archetype {
  name: string;
  description: string;
  stats: Stats;
}

/** PerkSystem snapshot for save/load. */
export interface PerkSnapshot {
  active: string[];
  bruteForceUsed: boolean;
  codeReviewUsed: boolean;
  negotiateUsed: boolean;
  cleanDeployUsed: boolean;
  ironNervesUsed?: boolean;
}

/** SpecialSystem snapshot for save/load. */
export interface SpecialSnapshot {
  stats: Stats;
  equipmentBonuses: Stats;
}

/** The shape of a localStorage run save (SaveSystem). The SaveData class
 * in save.js validates this shape and wraps a valid instance. */
export interface SaveDataShape {
  state: GameState;
  special: SpecialSnapshot;
  perks: PerkSnapshot;
  // Optional: saves from before the seeded-run feature have no field —
  // they load unseeded (Math.random).
  rng?: RngSnapshot;
  timestamp: number;
}

/** The shape of the devlife_meta localStorage entry (MetaStore). */
export interface MetaState {
  totalRuns?: number;
  lastRunDate?: string;
  startingEquipment?: string[];
  startingConsumables?: string[];
  /** Last difficulty chosen on the title screen; defaults to easy. */
  lastSelectedDifficulty?: Difficulty;
  /** Lifetime career statistics (issue #53). */
  stats?: MetaStats;
  /** Completed runs for the leaderboard (issue #53 follow-up). */
  runHistory?: RunRecord[];
}

// Lifetime statistics, persisted across runs. All fields optional so old
// saves (pre-statistics) load cleanly; readers apply the zero defaults.
export interface MetaStats {
  wins?: number;
  losses?: number;
  bestDay?: number;
  bestDayDifficulty?: Difficulty;
  /** Wins per difficulty (issue #53 — win rate by difficulty). */
  winsByDifficulty?: Partial<Record<Difficulty, number>>;
  lossesByDifficulty?: Partial<Record<Difficulty, number>>;
  /** Total consumables used across all runs. */
  consumablesUsedTotal?: number;
  /** Sum of each base stat at run end; average = value / totalRuns. */
  statTotals?: Stats;
}

// The result of a finished run, folded into lifetime statistics.
// Passed to MetaStore.recordRunComplete (issue #53).
export interface RunResult {
  won: boolean;
  day: number;
  difficulty: Difficulty;
  consumablesUsed: number;
  /** Base stats at run end (not effective — equipment is a separate stat). */
  stats: Stats;
}

// Achievement types (used by the data tier's definitions and the engine's
// satisfaction checks; kept here — the canonical type home — so the core
// tier never needs to import from data/).
export type AchievementMode = 'Any' | 'Normal' | 'Hard';

export interface AchievementDefinition {
  id: string;
  mode: AchievementMode;
  title: string;
  description: string;
  emoji: string;
  implemented?: boolean;
  // Archetype achievements gate on this; universal ones leave it unset.
  archetype?: string;
  // The achievement-specific part of the satisfaction condition. The
  // engine separately applies the shared gates (mode, archetype).
  check: (state: GameState) => boolean;
}

export interface RunRecord {
  seed: string;
  difficulty: Difficulty;
  day: number;
  won: boolean;
  archetype: string;
  stats: Stats;
  consumablesUsed: number;
  equipmentId: string | null;
}
