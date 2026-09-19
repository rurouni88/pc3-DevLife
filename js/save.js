// Save/Load system
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
      const saveData = JSON.parse(data);
      if (!this.isValidSave(saveData)) {
        console.error('[DevLife] Save data is invalid; ignoring it');
        return null;
      }
      
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
  
  // Minimal shape check at the load boundary: a save from an older version
  // (or hand-edited) must not be restored into the live game.
  /** @param {unknown} saveData @returns {boolean} */
  isValidSave(saveData) {
    if (!saveData || typeof saveData !== 'object') return false;
    const state = /** @type {SaveData} */ (saveData).state;
    if (!state || typeof state !== 'object') return false;
    if (typeof state.level !== 'number' || typeof state.day !== 'number' || typeof state.phase !== 'number') return false;
    if (!state.stats || !Array.isArray(state.careerLog)) return false;
    return true;
  },
  
  deleteSave() {
    localStorage.removeItem(this.SAVE_KEY);
  }
};
