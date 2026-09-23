// Meta progression — persists across runs (run count, carried-over items).
// Owns the 'devlife_meta' localStorage shape; other modules must not
// read or write that key directly.

const MetaStore = {
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
      console.error('[DevLife] Meta data is corrupted; ignoring it', e);
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
  recordRunComplete(equipmentId: string | null, won: boolean, day: number, difficulty: Difficulty): void {
    const meta = this.load();
    meta.totalRuns = (meta.totalRuns || 0) + 1;
    meta.lastRunDate = new Date().toISOString();

    // Carry-over is exactly the equipment the run ended with (max 1):
    // replace, don't append — a mid-run swap must carry the NEW item
    // (issue #4: appending kept the oldest item winning via slice(0,1))
    meta.startingEquipment = equipmentId ? [equipmentId] : [];

    const stats = meta.stats || {};
    stats.wins = (stats.wins || 0) + (won ? 1 : 0);
    stats.losses = (stats.losses || 0) + (won ? 0 : 1);
    // Best run = furthest day reached; ties keep the earlier record.
    if (day > (stats.bestDay || 0)) {
      stats.bestDay = day;
      stats.bestDayDifficulty = difficulty;
    }
    meta.stats = stats;

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
    };
  },

  // Wipe lifetime statistics (issue #53). Carried items and the selected
  // difficulty are kept — only the numbers go.
  resetStats(): void {
    const meta = this.load();
    delete meta.totalRuns;
    delete meta.lastRunDate;
    delete meta.stats;
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
