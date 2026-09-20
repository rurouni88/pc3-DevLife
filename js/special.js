// SPECIAL stat system
const SpecialSystem = {
  /** @type {Stats} */
  stats: { S: 1, P: 1, E: 1, C: 1, I: 1, A: 1, L: 1 },
  /** @type {Stats} */
  equipmentBonuses: zeroStats(),
  /** @type {Stats} */
  temporaryBonuses: zeroStats(),
  /** @type {number | null} */
  temporaryMultiplier: null,
  
  // Initialize with starting values
  /** @param {Stats} stats */
  init(stats) {
    this.stats = { ...stats };
    this.equipmentBonuses = zeroStats();
  },
  
  // Add equipment bonus
  /** @param {string} emoji @param {Partial<Stats>} effects */
  addEquipment(emoji, effects) {
    for (const [stat, value] of /** @type {Array<[StatKey, number]>} */ (Object.entries(effects))) {
      this.equipmentBonuses[stat] += value;
    }
  },
  
  // Remove equipment bonus
  /** @param {string} emoji @param {Partial<Stats>} effects */
  removeEquipment(emoji, effects) {
    for (const [stat, value] of /** @type {Array<[StatKey, number]>} */ (Object.entries(effects))) {
      this.equipmentBonuses[stat] = Math.max(0, this.equipmentBonuses[stat] - value);
    }
  },
  
  // Get effective stat (base + equipment + temporary + multiplier)
  /** @param {StatKey} stat @returns {number} */
  effective(stat) {
    const base = this.stats[stat] || 0;
    const equipmentBonus = this.equipmentBonuses[stat] || 0;
    const tempBonus = this.temporaryBonuses[stat] || 0;
    let total = base + equipmentBonus + tempBonus;
    
    // Apply multiplier if active
    if (this.temporaryMultiplier) {
      total = Math.round(total * this.temporaryMultiplier);
    }
    
    return total;
  },
  
  // Apply temporary bonus (for consumables)
  /** @param {StatKey} stat @param {number} bonus */
  applyTempBonus(stat, bonus) {
    this.temporaryBonuses[stat] = (this.temporaryBonuses[stat] || 0) + bonus;
  },
  
  // Clear temporary bonuses after a check
  clearTempBonuses() {
    this.temporaryBonuses = zeroStats();
    this.temporaryMultiplier = null;
  },
  
  // Apply multiplier
  /** @param {number} multiplier */
  applyMultiplier(multiplier) {
    this.temporaryMultiplier = multiplier;
  },
  
  // Check if a stat can be increased
  /** @param {StatKey} stat @returns {boolean} */
  canIncrease(stat) {
    return this.stats[stat] < MAX_STAT;
  },
  
  // Increase a stat
  /** @param {StatKey} stat @returns {boolean} */
  increase(stat) {
    if (this.canIncrease(stat)) {
      this.stats[stat]++;
      return true;
    }
    return false;
  },
  
  // Clone for save/load
  /** @returns {SpecialSnapshot} */
  clone() {
    return {
      stats: { ...this.stats },
      equipmentBonuses: { ...this.equipmentBonuses }
    };
  },
  
  // Restore from clone
  /** @param {SpecialSnapshot} data */
  restore(data) {
    this.stats = { ...data.stats };
    this.equipmentBonuses = { ...data.equipmentBonuses };
  }
};
