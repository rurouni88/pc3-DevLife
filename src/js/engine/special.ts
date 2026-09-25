// SPECIAL stat system
import { MAX_STAT } from '../data/archetypes.js';
import { zeroStats } from '../core/utils.js';
import type { SpecialSnapshot, StatKey, Stats } from '../core/types.js';

export const SpecialSystem = {
  stats: { S: 1, P: 1, E: 1, C: 1, I: 1, A: 1, L: 1 },
  equipmentBonuses: zeroStats(),
  temporaryBonuses: zeroStats(),
  temporaryMultiplier: null as number | null,

  // Initialize with starting values
  init(stats: Stats): void {
    this.stats = { ...stats };
    this.equipmentBonuses = zeroStats();
  },

  // Add equipment bonus
  addEquipment(emoji: string, effects: Partial<Stats>): void {
    for (const [stat, value] of Object.entries(effects) as [StatKey, number][]) {
      this.equipmentBonuses[stat] += value;
    }
  },

  // Remove equipment bonus
  removeEquipment(emoji: string, effects: Partial<Stats>): void {
    for (const [stat, value] of Object.entries(effects) as [StatKey, number][]) {
      this.equipmentBonuses[stat] = Math.max(0, this.equipmentBonuses[stat] - value);
    }
  },

  // Get effective stat (base + equipment + temporary + multiplier)
  effective(stat: StatKey): number {
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
  applyTempBonus(stat: StatKey, bonus: number): void {
    this.temporaryBonuses[stat] = (this.temporaryBonuses[stat] || 0) + bonus;
  },

  // Clear temporary bonuses after a check
  clearTempBonuses(): void {
    this.temporaryBonuses = zeroStats();
    this.temporaryMultiplier = null;
  },

  // Apply multiplier
  applyMultiplier(multiplier: number): void {
    this.temporaryMultiplier = multiplier;
  },

  // Check if a stat can be increased
  canIncrease(stat: StatKey): boolean {
    return this.stats[stat] < MAX_STAT;
  },

  // Increase a stat
  increase(stat: StatKey): boolean {
    if (this.canIncrease(stat)) {
      this.stats[stat]++;
      return true;
    }
    return false;
  },

  // Clone for save/load
  clone(): SpecialSnapshot {
    return {
      stats: { ...this.stats },
      equipmentBonuses: { ...this.equipmentBonuses }
    };
  },

  // Restore from clone
  restore(snapshot: SpecialSnapshot): void {
    this.stats = { ...snapshot.stats };
    this.equipmentBonuses = { ...snapshot.equipmentBonuses };
  }
};
