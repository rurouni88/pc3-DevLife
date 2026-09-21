// Perk system — stat mastery perks
// A perk activates when a BASE stat reaches MAX_STAT (10). Equipment and
// temporary (consumable) bonuses do not count. Perks are per-run: if a stat
// drops below 10, its perk is lost until the stat reaches 10 again.

const PERKS: Record<StatKey, { id: string; name: string; emoji: string; desc: string }> = {
  S: { id: 'brute_force',   name: 'Brute Force',   emoji: '💪', desc: 'Once per run: +2 to a failed Strength check target' },
  P: { id: 'code_review',   name: 'Code Review',   emoji: '🐛', desc: 'Once per run: halve a negative stat effect (round up)' },
  E: { id: 'iron_nerves',   name: 'Iron Nerves',   emoji: '🧘', desc: 'Once per run: a hit that would drop Endurance to the floor (1) stops it at 3 instead' },
  C: { id: 'negotiate',     name: 'Negotiate',     emoji: '🤝', desc: 'Once per run: a failed stat check is converted to a success' },
  I: { id: 'rapid_learner', name: 'Rapid Learner', emoji: '🧠', desc: '+1 bonus point on every level up' },
  A: { id: 'fast_ship',     name: 'Fast Ship',     emoji: '🚀', desc: 'Bosses appear every 5 events instead of 6' },
  L: { id: 'clean_deploy',  name: 'Clean Deploy',  emoji: '🍀', desc: 'Once per run: reroll a failed stat check' }
};

// Lookup by perk id
const PERK_BY_ID: Record<string, { id: string; name: string; emoji: string; desc: string }> = {};
Object.values(PERKS).forEach(perk => { PERK_BY_ID[perk.id] = perk; });

const PerkSystem = {
  active: [] as string[],         // perk ids currently active
  bruteForceUsed: false,   // Brute Force is once per run
  codeReviewUsed: false,   // Code Review is once per run
  negotiateUsed: false,    // Negotiate is once per run
  cleanDeployUsed: false,  // Clean Deploy reroll is once per run
  ironNervesUsed: false,   // Iron Nerves burnout save is once per run

  // Reset for a new run
  reset(): void {
    this.active = [];
    this.bruteForceUsed = false;
    this.codeReviewUsed = false;
    this.negotiateUsed = false;
    this.cleanDeployUsed = false;
    this.ironNervesUsed = false;
  },

  // Recompute active perks from base stats.
  // Returns { gained: [perkId], lost: [perkId] }
  refresh(): { gained: string[]; lost: string[] } {
    const nowActive = STAT_KEYS
      .filter(key => (SpecialSystem.stats[key] || 0) >= MAX_STAT)
      .map(key => PERKS[key].id);

    const gained = nowActive.filter(id => !this.active.includes(id));
    const lost = this.active.filter(id => !nowActive.includes(id));
    this.active = nowActive;

    return { gained, lost };
  },

  has(perkId: string): boolean {
    return this.active.includes(perkId);
  },

  // 💪 Brute Force: once per run, +2 to a failed Strength check
  canUseBruteForce(): boolean {
    return this.has('brute_force') && !this.bruteForceUsed;
  },

  useBruteForce(): void {
    this.bruteForceUsed = true;
  },

  // 🐛 Code Review: once per run, halve a negative effect
  canUseCodeReview(): boolean {
    return this.has('code_review') && !this.codeReviewUsed;
  },

  useCodeReview(): void {
    this.codeReviewUsed = true;
  },

  // 🤝 Negotiate: once per run, convert a failed check to success
  canNegotiate(): boolean {
    return this.has('negotiate') && !this.negotiateUsed;
  },

  useNegotiate(): void {
    this.negotiateUsed = true;
  },

  // 🧠 Rapid Learner: +1 level up point
  levelUpPoints(): number {
    return 1 + (this.has('rapid_learner') ? 1 : 0);
  },

  // 🚀 Fast Ship: boss (and level) cadence
  bossInterval(): number {
    return this.has('fast_ship') ? 5 : EVENTS_PER_BOSS;
  },

  // 🍀 Clean Deploy: once per run, reroll a failed stat check
  canCleanDeployReroll(): boolean {
    return this.has('clean_deploy') && !this.cleanDeployUsed;
  },

  useCleanDeployReroll(): void {
    this.cleanDeployUsed = true;
  },

  // 🧘 Iron Nerves: once per run, a hit that would floor Endurance stops
  // it at 3 instead. Judged in applyChoice BEFORE effects are applied —
  // the perk was active when the blow landed, even though the effect
  // itself revokes it (E lands at 3, below the 10 perk gate).
  canUseIronNerves(): boolean {
    return this.has('iron_nerves') && !this.ironNervesUsed;
  },

  useIronNerves(): void {
    this.ironNervesUsed = true;
  },

  // Helper: apply brute force to a check target
  applyBruteForce(target: number): number {
    return target + 2;
  },

  // Helper: apply code review to an effect value
  applyCodeReview(value: number): number {
    return -Math.ceil(Math.abs(value) / 2);
  },

  // Clone for save/load
  clone(): PerkSnapshot {
    return {
      active: [...this.active],
      bruteForceUsed: this.bruteForceUsed,
      codeReviewUsed: this.codeReviewUsed,
      negotiateUsed: this.negotiateUsed,
      cleanDeployUsed: this.cleanDeployUsed,
      ironNervesUsed: this.ironNervesUsed
    };
  },

  // Restore from clone
  restore(data: PerkSnapshot | null): void {
    if (!data) {
      this.reset();
      return;
    }
    this.active = [...(data.active || [])];
    this.bruteForceUsed = !!data.bruteForceUsed;
    this.codeReviewUsed = !!data.codeReviewUsed;
    this.negotiateUsed = !!data.negotiateUsed;
    this.cleanDeployUsed = !!data.cleanDeployUsed;
    // Saves from before v0.31 have no ironNervesUsed — treat as unused
    this.ironNervesUsed = !!data.ironNervesUsed;
  }
};
