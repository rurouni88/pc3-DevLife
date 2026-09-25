// Meta progression — persists across runs (run count, carried-over items).
// Owns the 'devlife_meta' localStorage shape; other modules must not
// read or write that key directly.

import { zeroStats } from '../core/utils.js';
import { STAT_KEYS } from '../data/archetypes.js';
import { Game } from './game.js';
import { SaveSystem } from './save.js';
import type { Difficulty, MetaState, MetaStats, RunRecord, RunResult } from '../core/types.js';

export const MetaStore = {
  KEY: 'devlife_meta',

  // Parse with a guard: a corrupted entry must not take the game down —
  // same posture as SaveSystem.load (log and fall back to empty meta).
  load(): MetaState {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return {};
    try {
      const meta = JSON.parse(raw);
      return meta && typeof meta === 'object' ? meta as MetaState : {};
    } catch (e) {
      console.error('[d20().devLife] Meta data is corrupted; ignoring it', e);
      return {};
    }
  },

  save(meta: MetaState): void {
    localStorage.setItem(this.KEY, JSON.stringify(meta));
  },

  // Number of completed runs so far
  runCount(): number {
    return this.load().totalRuns || 0;
  },

  // Record a finished run: increment counter, timestamp, carry over
  // equipment, and fold the result into the lifetime statistics (#53).
  recordRunComplete(equipmentId: string | null, result: RunResult, seed: string, archetype: string): void {
    const meta = this.load();
    meta.totalRuns = (meta.totalRuns || 0) + 1;
    meta.lastRunDate = new Date().toISOString();

    // Carry-over is exactly the equipment the run ended with (max 1):
    // replace, don't append — a mid-run swap must carry the NEW item
    // (issue #4: appending kept the oldest item winning via slice(0,1))
    meta.startingEquipment = equipmentId ? [equipmentId] : [];

    const stats = meta.stats || {};
    stats.wins = (stats.wins || 0) + (result.won ? 1 : 0);
    stats.losses = (stats.losses || 0) + (result.won ? 0 : 1);
    // Best run = furthest day reached; ties keep the earlier record.
    if (result.day > (stats.bestDay || 0)) {
      stats.bestDay = result.day;
      stats.bestDayDifficulty = result.difficulty;
    }
    // Win rate by difficulty (issue #53).
    const wbd = stats.winsByDifficulty || {};
    const lbd = stats.lossesByDifficulty || {};
    wbd[result.difficulty] = (wbd[result.difficulty] || 0) + (result.won ? 1 : 0);
    lbd[result.difficulty] = (lbd[result.difficulty] || 0) + (result.won ? 0 : 1);
    stats.winsByDifficulty = wbd;
    stats.lossesByDifficulty = lbd;
    // Consumables used total (issue #53).
    stats.consumablesUsedTotal = (stats.consumablesUsedTotal || 0) + result.consumablesUsed;
    // Per-stat totals at run end (issue #53) — average = value / totalRuns.
    const totals = stats.statTotals || zeroStats();
    STAT_KEYS.forEach(k => { totals[k] += result.stats[k]; });
    stats.statTotals = totals;
    meta.stats = stats;

    // Leaderboard: append a RunRecord.
    const history = meta.runHistory || [];
    history.push({
      seed,
      difficulty: result.difficulty,
      day: result.day,
      won: result.won,
      archetype,
      stats: { ...result.stats },
      consumablesUsed: result.consumablesUsed,
      equipmentId,
    });
    meta.runHistory = history;

    this.save(meta);
  },

  // Lifetime statistics with zero defaults (old saves have no stats block).
  metaStats(): Required<MetaStats> {
    const s = this.load().stats || {};
    return {
      wins: s.wins || 0,
      losses: s.losses || 0,
      bestDay: s.bestDay || 0,
      bestDayDifficulty: s.bestDayDifficulty || 'easy',
      winsByDifficulty: s.winsByDifficulty || {},
      lossesByDifficulty: s.lossesByDifficulty || {},
      consumablesUsedTotal: s.consumablesUsedTotal || 0,
      statTotals: s.statTotals || zeroStats(),
    };
  },

  // Return the top N runs for a given difficulty, sorted by day
  // (descending), then won before lost as a tiebreaker.
  getTopRuns(difficulty: Difficulty, count: number): RunRecord[] {
    const history = this.load().runHistory || [];
    return history
      .filter(r => r.difficulty === difficulty)
      .sort((a, b) => {
        if (b.day !== a.day) return b.day - a.day;
        if ((a.won ? 1 : 0) !== (b.won ? 1 : 0)) return (b.won ? 1 : 0) - (a.won ? 1 : 0);
        return 0;
      })
      .slice(0, count);
  },

  // Wipe lifetime statistics (issue #53). Carried items and the selected
  // difficulty are kept — only the numbers go.
  resetStats(): void {
    const meta = this.load();
    delete meta.totalRuns;
    delete meta.lastRunDate;
    delete meta.stats;
    delete meta.runHistory;
    this.save(meta);
  },

  // Carry a consumable into future runs. With a replaceIndex (Stock Up
  // swap), the pick replaces that slot. Otherwise selection = most recent:
  // the pick moves to the end of the pool (re-picking an older entry
  // refreshes it — the old skip-if-exists left stale entries winning via
  // slice(-2)), and the pool is capped at the 2 slots that get granted.
  addCarriedConsumable(id: string, replaceIndex: number = -1): void {
    const meta = this.load();
    const pool = meta.startingConsumables || [];
    if (replaceIndex >= 0 && replaceIndex < pool.length) {
      meta.startingConsumables = pool.map((x, i) => (i === replaceIndex ? id : x));
    } else {
      // Cap = the equipment this run ended with (it carries over as-is),
      // so a Backpack in hand lets the stash hold one more.
      meta.startingConsumables = [...pool.filter(x => x !== id), id].slice(-Game.consumableCap());
    }
    this.save(meta);
  },

  // IDs of items carried into a new run ('startingConsumables' or 'startingEquipment')
  carriedIds(kind: 'startingConsumables' | 'startingEquipment'): string[] {
    return (this.load()[kind] || []).slice();
  },

  // Difficulty chosen on the title screen (issue #6). Defaults to easy when
  // unset (first run) or when the stored value is not a valid difficulty.
  selectedDifficulty(): Difficulty {
    const d = this.load().lastSelectedDifficulty;
    return d === 'easy' || d === 'normal' || d === 'hard' ? d : 'easy';
  },

  setSelectedDifficulty(d: Difficulty): void {
    const meta = this.load();
    meta.lastSelectedDifficulty = d;
    this.save(meta);
  },
};
