// Save/Load system
const SaveSystem = {
  SAVE_KEY: 'devlife_save',
  
  save(state) {
    const saveData = {
      state: { ...state },
      special: SpecialSystem.clone(),
      perks: PerkSystem.clone(),
      timestamp: Date.now()
    };
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
  },
  
  load() {
    const data = localStorage.getItem(this.SAVE_KEY);
    if (!data) return null;
    
    try {
      const saveData = JSON.parse(data);
      
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
