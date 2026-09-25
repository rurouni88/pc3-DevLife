// Save/Load system

// Schema validation for run saves. A save from an older version (or a
// hand-edited one) must not be restored into the live game. SaveData owns
// the shape rules in one place; validate() reports ALL problems at once
// so a bad save is diagnosable from the log, not just "rejected".
class SaveData {
  state: GameState;
  special: SpecialSnapshot;
  perks: PerkSnapshot;
  rng: RngSnapshot | null;
  timestamp: number;

  constructor(state: GameState, special: SpecialSnapshot, perks: PerkSnapshot, rng: RngSnapshot | null, timestamp: number) {
    this.state = state;
    this.special = special;
    this.perks = perks;
    this.rng = rng;
    this.timestamp = timestamp;
  }

  // Parse and validate raw localStorage JSON. Returns null (with logged
  // reasons) when invalid.
  static parse(data: unknown): SaveData | null {
    const errors = SaveData.validate(data);
    if (errors.length > 0) {
      console.error('[d20().devLife] Save data is invalid:', errors.join('; '));
      return null;
    }
    const save = data as SaveDataShape;
    return new SaveData(save.state, save.special, save.perks, save.rng ?? null, save.timestamp);
  }

  // Validate a raw save against the schema. Returns human-readable problems
  // (empty when valid).
  static validate(data: unknown): string[] {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return ['save is not an object'];
    }
    const save = data as Record<string, unknown>;
    const errors: string[] = [];

    if (typeof save.timestamp !== 'number') errors.push('timestamp is not a number');

    const state = save.state as Record<string, unknown> | undefined;
    if (!state || typeof state !== 'object') {
      errors.push('state is missing');
    } else {
      for (const field of ['level', 'day', 'phase']) {
        if (typeof state[field] !== 'number') errors.push(`state.${field} is not a number`);
      }
      // Optional: saves from before the difficulty feature have no field —
      // they load as easy (the default in createCharacter).
      if (state.difficulty !== undefined && !['easy', 'normal', 'hard'].includes(state.difficulty as string)) {
        errors.push('state.difficulty is not a valid difficulty');
      }
      // Optional: saves from before the achievements feature have no field —
      // they load with no starting archetype (treated as 'custom' at run end).
      if (state.archetype !== undefined && typeof state.archetype !== 'string') {
        errors.push('state.archetype is not a string');
      }
      if (state.consumablesUsed !== undefined && typeof state.consumablesUsed !== 'number') {
        errors.push('state.consumablesUsed is not a number');
      }
      // Optional: saves from before the seeded-run feature have no field —
      // they load unseeded (Math.random).
      if (state.seed !== undefined && typeof state.seed !== 'string') {
        errors.push('state.seed is not a string');
      }
      const stats = state.stats as Record<string, unknown> | undefined;
      if (!stats || typeof stats !== 'object') {
        errors.push('state.stats is missing');
      } else {
        for (const key of STAT_KEYS) {
          if (typeof stats[key] !== 'number') errors.push(`state.stats.${key} is not a number`);
        }
      }
      if (!Array.isArray(state.careerLog)) errors.push('state.careerLog is not an array');
      if (!Array.isArray(state.equipment)) errors.push('state.equipment is not an array');
      if (!Array.isArray(state.consumables)) errors.push('state.consumables is not an array');
    }

    const special = save.special as Record<string, unknown> | undefined;
    if (!special || typeof special !== 'object') {
      errors.push('special is missing');
    } else {
      for (const field of ['stats', 'equipmentBonuses']) {
        if (!special[field] || typeof special[field] !== 'object') errors.push(`special.${field} is missing`);
      }
    }

    const perks = save.perks as Record<string, unknown> | undefined;
    if (!perks || typeof perks !== 'object') {
      errors.push('perks is missing');
    } else {
      if (!Array.isArray(perks.active)) errors.push('perks.active is not an array');
      for (const flag of ['bruteForceUsed', 'codeReviewUsed', 'negotiateUsed', 'cleanDeployUsed']) {
        if (typeof perks[flag] !== 'boolean') errors.push(`perks.${flag} is not a boolean`);
      }
      // Optional: saves from before v0.31 have no ironNervesUsed
      if (perks.ironNervesUsed !== undefined && typeof perks.ironNervesUsed !== 'boolean') {
        errors.push('perks.ironNervesUsed is not a boolean');
      }
    }

    // Optional: saves from before the seeded-run feature have no field —
    // they load unseeded (Math.random).
    const rng = save.rng as Record<string, unknown> | undefined;
    if (rng !== undefined) {
      if (!rng || typeof rng !== 'object') {
        errors.push('rng is not an object');
      } else {
        if (typeof rng.seed !== 'string') errors.push('rng.seed is not a string');
        if (rng.state !== null && typeof rng.state !== 'number') errors.push('rng.state is not a number or null');
      }
    }

    return errors;
  }
}

const SaveSystem = {
  SAVE_KEY: 'devlife_save',

  save(state: GameState): void {
    const saveData = {
      state: { ...state },
      special: SpecialSystem.clone(),
      perks: PerkSystem.clone(),
      // PRNG position — a seeded run resumes from the exact same point
      // in the sequence after a load.
      rng: RngEngine.getState(),
      timestamp: Date.now()
    };
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
  },

  load(): SaveData | null {
    const data = localStorage.getItem(this.SAVE_KEY);
    if (!data) return null;

    try {
      const saveData = SaveData.parse(JSON.parse(data));
      if (!saveData) return null;

      // Restore game state
      Game.state = saveData.state;

      // Restore SPECIAL system
      SpecialSystem.restore(saveData.special);

      // Restore perk system (negotiate-used flag; active perks re-sync from stats)
      PerkSystem.restore(saveData.perks);
      PerkSystem.refresh();

      // Restore the PRNG (unseeded for saves predating the field)
      RngEngine.setState(saveData.rng);

      return saveData;
    } catch (e) {
      console.error('Failed to load save:', e);
      return null;
    }
  },

  hasSave(): boolean {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  },

  deleteSave(): void {
    localStorage.removeItem(this.SAVE_KEY);
  }
};
