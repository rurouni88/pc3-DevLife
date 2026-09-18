// SPECIAL stat system
const SpecialSystem = {
  stats: { S: 1, P: 1, E: 1, C: 1, I: 1, A: 1, L: 1 },
  equipmentBonuses: {},
  temporaryBonuses: { S: 0, P: 0, E: 0, C: 0, I: 0, A: 0, L: 0 },
  temporaryMultiplier: null,
  
  // Initialize with starting values
  init(stats) {
    this.stats = { ...stats };
    this.equipmentBonuses = { S: 0, P: 0, E: 0, C: 0, I: 0, A: 0, L: 0 };
  },
  
  // Add equipment bonus
  addEquipment(emoji, effects) {
    for (const [stat, value] of Object.entries(effects)) {
      if (this.equipmentBonuses[stat] !== undefined) {
        this.equipmentBonuses[stat] += value;
      }
    }
  },
  
  // Remove equipment bonus
  removeEquipment(emoji, effects) {
    for (const [stat, value] of Object.entries(effects)) {
      if (this.equipmentBonuses[stat] !== undefined) {
        this.equipmentBonuses[stat] = Math.max(0, this.equipmentBonuses[stat] - value);
      }
    }
  },
  
  // Get effective stat (base + equipment + temporary + multiplier)
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
  applyTempBonus(stat, bonus) {
    this.temporaryBonuses[stat] = (this.temporaryBonuses[stat] || 0) + bonus;
  },
  
  // Clear temporary bonuses after a check
  clearTempBonuses() {
    this.temporaryBonuses = { S: 0, P: 0, E: 0, C: 0, I: 0, A: 0, L: 0 };
    this.temporaryMultiplier = null;
  },
  
  // Apply multiplier
  applyMultiplier(multiplier) {
    this.temporaryMultiplier = multiplier;
  },
  
  // Get total points in base stats
  totalPoints() {
    return STAT_KEYS.reduce((sum, key) => sum + this.stats[key], 0);
  },
  
  // Check if a stat can be increased
  canIncrease(stat) {
    return this.stats[stat] < MAX_STAT;
  },
  
  // Increase a stat
  increase(stat) {
    if (this.canIncrease(stat)) {
      this.stats[stat]++;
      return true;
    }
    return false;
  },
  
  // Perform a stat check (d20 system)
  // target: the stat value needed to succeed
  // stat: which SPECIAL stat to use
  check(stat, target) {
    const effective = this.effective(stat);
    const roll = d20();
    const success = roll <= target;
    return { roll, target: effective, success, stat };
  },
  
  // Multi-stat check (requires ALL to pass)
  multiCheck(checks) {
    const results = [];
    let allSuccess = true;
    
    for (const [stat, target] of Object.entries(checks)) {
      const result = this.check(stat, target);
      results.push(result);
      if (!result.success) allSuccess = false;
    }
    
    return { results, allSuccess };
  },
  
  // Clone for save/load
  clone() {
    return {
      stats: { ...this.stats },
      equipmentBonuses: { ...this.equipmentBonuses }
    };
  },
  
  // Restore from clone
  restore(data) {
    this.stats = { ...data.stats };
    this.equipmentBonuses = { ...data.equipmentBonuses };
  }
};
