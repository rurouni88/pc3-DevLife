// Meta progression — persists across runs (run count, carried-over items).
// Owns the 'devlife_meta' localStorage shape; other modules must not
// read or write that key directly.

const MetaStore = {
  KEY: 'devlife_meta',
  
  /** @returns {MetaState} */
  load() {
    return JSON.parse(localStorage.getItem(this.KEY) || '{}');
  },
  
  save(meta) {
    localStorage.setItem(this.KEY, JSON.stringify(meta));
  },
  
  // Number of completed runs so far
  runCount() {
    return this.load().totalRuns || 0;
  },
  
  // Record a finished run: increment counter, timestamp, carry over equipment
  /** @param {string | null} equipmentId */
  recordRunComplete(equipmentId) {
    const meta = this.load();
    meta.totalRuns = (meta.totalRuns || 0) + 1;
    meta.lastRunDate = new Date().toISOString();
    
    // Save equipment to carry over (max 1); skip if already carried
    if (equipmentId && !(meta.startingEquipment || []).includes(equipmentId)) {
      meta.startingEquipment = [...(meta.startingEquipment || []), equipmentId];
    }
    
    this.save(meta);
  },
  
  // Carry a consumable into future runs; skip if already carried
  addCarriedConsumable(id) {
    const meta = this.load();
    if (!meta.startingConsumables || !meta.startingConsumables.includes(id)) {
      meta.startingConsumables = [...(meta.startingConsumables || []), id];
    }
    this.save(meta);
  },
  
  // IDs of items carried into a new run ('startingConsumables' or 'startingEquipment')
  /** @param {'startingConsumables' | 'startingEquipment'} kind @returns {string[]} */
  carriedIds(kind) {
    return (this.load()[kind] || []).slice();
  },
};
