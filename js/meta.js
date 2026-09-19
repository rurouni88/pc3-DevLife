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
    
    // Carry-over is exactly the equipment the run ended with (max 1):
    // replace, don't append — a mid-run swap must carry the NEW item
    // (issue #4: appending kept the oldest item winning via slice(0,1))
    meta.startingEquipment = equipmentId ? [equipmentId] : [];
    
    this.save(meta);
  },
  
  // Carry a consumable into future runs. Selection = most recent: the pick
  // moves to the end of the pool (re-picking an older entry refreshes it —
  // the old skip-if-exists left stale entries winning via slice(-2)), and
  // the pool is capped at the 2 slots that get granted.
  addCarriedConsumable(id) {
    const meta = this.load();
    const pool = (meta.startingConsumables || []).filter(x => x !== id);
    meta.startingConsumables = [...pool, id].slice(-2);
    this.save(meta);
  },
  
  // IDs of items carried into a new run ('startingConsumables' or 'startingEquipment')
  /** @param {'startingConsumables' | 'startingEquipment'} kind @returns {string[]} */
  carriedIds(kind) {
    return (this.load()[kind] || []).slice();
  },
};
