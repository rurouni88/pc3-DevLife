// Perk system — stat mastery perks
// A perk activates when a BASE stat reaches MAX_STAT (10). Equipment and
// temporary (consumable) bonuses do not count. Perks are per-run: if a stat
// drops below 10, its perk is lost until the stat reaches 10 again.

const PERKS = {
  S: { id: 'brute_force',   name: 'Brute Force',   emoji: '💪', desc: 'Once per run: +2 to a failed Strength check target' },
  P: { id: 'code_review',   name: 'Code Review',   emoji: '🐛', desc: 'Once per run: halve a negative stat effect (round up)' },
  E: { id: 'iron_nerves',   name: 'Iron Nerves',   emoji: '🧘', desc: 'Immune to burnout death from low Endurance' },
  C: { id: 'negotiate',     name: 'Negotiate',     emoji: '🤝', desc: 'Once per run: a failed stat check is converted to a success' },
  I: { id: 'rapid_learner', name: 'Rapid Learner', emoji: '🧠', desc: '+1 bonus point on every level up' },
  A: { id: 'fast_ship',     name: 'Fast Ship',     emoji: '🚀', desc: 'Bosses appear every 5 events instead of 6' },
  L: { id: 'clean_deploy',  name: 'Clean Deploy',  emoji: '🍀', desc: 'Once per run: reroll a failed stat check' }
};

// Lookup by perk id
const PERK_BY_ID = {};
Object.values(PERKS).forEach(perk => { PERK_BY_ID[perk.id] = perk; });

const PerkSystem = {
  active: [],              // perk ids currently active
  bruteForceUsed: false,   // Brute Force is once per run
  codeReviewUsed: false,   // Code Review is once per run
  negotiateUsed: false,    // Negotiate is once per run
  cleanDeployUsed: false,  // Clean Deploy reroll is once per run
  
  // Reset for a new run
  reset() {
    this.active = [];
    this.bruteForceUsed = false;
    this.codeReviewUsed = false;
    this.negotiateUsed = false;
    this.cleanDeployUsed = false;
  },
  
  // Recompute active perks from base stats.
  // Returns { gained: [perkId], lost: [perkId] }
  refresh() {
    const nowActive = STAT_KEYS
      .filter(key => (SpecialSystem.stats[key] || 0) >= MAX_STAT)
      .map(key => PERKS[key].id);
    
    const gained = nowActive.filter(id => !this.active.includes(id));
    const lost = this.active.filter(id => !nowActive.includes(id));
    this.active = nowActive;
    
    return { gained, lost };
  },
  
  has(perkId) {
    return this.active.includes(perkId);
  },
  
  // 💪 Brute Force: once per run, +2 to a failed Strength check
  canUseBruteForce() {
    return this.has('brute_force') && !this.bruteForceUsed;
  },
  
  useBruteForce() {
    this.bruteForceUsed = true;
  },
  
  // 🐛 Code Review: once per run, halve a negative effect
  canUseCodeReview() {
    return this.has('code_review') && !this.codeReviewUsed;
  },
  
  useCodeReview() {
    this.codeReviewUsed = true;
  },
  
  // 🤝 Negotiate: once per run, convert a failed check to success
  canNegotiate() {
    return this.has('negotiate') && !this.negotiateUsed;
  },
  
  useNegotiate() {
    this.negotiateUsed = true;
  },
  
  // 🧠 Rapid Learner: +1 level up point
  levelUpPoints() {
    return 1 + (this.has('rapid_learner') ? 1 : 0);
  },
  
  // 🚀 Fast Ship: boss (and level) cadence
  bossInterval() {
    return this.has('fast_ship') ? 5 : EVENTS_PER_BOSS;
  },
  
  // 🍀 Clean Deploy: once per run, reroll a failed stat check
  canCleanDeployReroll() {
    return this.has('clean_deploy') && !this.cleanDeployUsed;
  },
  
  useCleanDeployReroll() {
    this.cleanDeployUsed = true;
  },
  
  // Helper: apply brute force to a check target
  applyBruteForce(target) {
    return target + 2;
  },
  
  // Helper: apply code review to an effect value
  applyCodeReview(value) {
    return -Math.ceil(Math.abs(value) / 2);
  },
  
  // Clone for save/load
  clone() {
    return {
      active: [...this.active],
      bruteForceUsed: this.bruteForceUsed,
      codeReviewUsed: this.codeReviewUsed,
      negotiateUsed: this.negotiateUsed,
      cleanDeployUsed: this.cleanDeployUsed
    };
  },
  
  // Restore from clone
  restore(data) {
    if (!data) {
      this.reset();
      return;
    }
    this.active = [...(data.active || [])];
    this.bruteForceUsed = !!data.bruteForceUsed;
    this.codeReviewUsed = !!data.codeReviewUsed;
    this.negotiateUsed = !!data.negotiateUsed;
    this.cleanDeployUsed = !!data.cleanDeployUsed;
  }
};
