// Save/Load system

// Schema validation for run saves. A save from an older version (or a
// hand-edited one) must not be restored into the live game. SaveData owns
// the shape rules in one place; validate() reports ALL problems at once
// so a bad save is diagnosable from the log, not just "rejected".
class SaveData {
  /**
   * @param {GameState} state
   * @param {SpecialSnapshot} special
   * @param {PerkSnapshot} perks
   * @param {number} timestamp
   */
  constructor(state, special, perks, timestamp) {
    this.state = state;
    this.special = special;
    this.perks = perks;
    this.timestamp = timestamp;
  }
  
  // Parse and validate raw localStorage JSON.
  /** @param {unknown} data @returns {SaveData | null} null (with logged reasons) when invalid */
  static parse(data) {
    const errors = SaveData.validate(data);
    if (errors.length > 0) {
      console.error('[DevLife] Save data is invalid:', errors.join('; '));
      return null;
    }
    const save = /** @type {SaveDataShape} */ (data);
    return new SaveData(save.state, save.special, save.perks, save.timestamp);
  }
  
  // Validate a raw save against the schema.
  /** @param {unknown} data @returns {string[]} human-readable problems (empty when valid) */
  static validate(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return ['save is not an object'];
    }
    const save = /** @type {Record<string, unknown>} */ (data);
    const errors = [];
    
    if (typeof save.timestamp !== 'number') errors.push('timestamp is not a number');
    
    const state = /** @type {Record<string, unknown> | undefined} */ (save.state);
    if (!state || typeof state !== 'object') {
      errors.push('state is missing');
    } else {
      for (const field of ['level', 'day', 'phase']) {
        if (typeof state[field] !== 'number') errors.push(`state.${field} is not a number`);
      }
      const stats = /** @type {Record<string, unknown> | undefined} */ (state.stats);
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
    
    const special = /** @type {Record<string, unknown> | undefined} */ (save.special);
    if (!special || typeof special !== 'object') {
      errors.push('special is missing');
    } else {
      for (const field of ['stats', 'equipmentBonuses']) {
        if (!special[field] || typeof special[field] !== 'object') errors.push(`special.${field} is missing`);
      }
    }
    
    const perks = /** @type {Record<string, unknown> | undefined} */ (save.perks);
    if (!perks || typeof perks !== 'object') {
      errors.push('perks is missing');
    } else {
      if (!Array.isArray(perks.active)) errors.push('perks.active is not an array');
      for (const flag of ['bruteForceUsed', 'codeReviewUsed', 'negotiateUsed', 'cleanDeployUsed']) {
        if (typeof perks[flag] !== 'boolean') errors.push(`perks.${flag} is not a boolean`);
      }
    }
    
    return errors;
  }
}

const SaveSystem = {
  SAVE_KEY: 'devlife_save',
  
  /** @param {GameState} state */
  save(state) {
    const saveData = {
      state: { ...state },
      special: SpecialSystem.clone(),
      perks: PerkSystem.clone(),
      timestamp: Date.now()
    };
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
  },
  
  /** @returns {SaveData | null} */
  load() {
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
      
      return saveData;
    } catch (e) {
      console.error('Failed to load save:', e);
      return null;
    }
  },
  
  hasSave() {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  },
  
  deleteSave() {
    localStorage.removeItem(this.SAVE_KEY);
  }
};
