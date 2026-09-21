// Game configuration — all tunable constants in one place
const CONFIG = {
  version: '0.32',
  versionLabel: 'Prototype',

  stats: {
    min: 1,
    max: 10,
    keys: ['S', 'P', 'E', 'C', 'I', 'A', 'L'],
    startingPoints: 40,
  },

  game: {
    eventsPerBoss: 6,
    daysPerCareerYear: 12,
    // Career phase display names, indexed by phase (1-4); index 0 unused
    phaseNames: ['', 'Junior Developer', 'Mid-Level Developer', 'Senior Developer', 'Staff/Principal'],
    bossPrefix: 'BOSS:',
    dropRate: 0.15,
    competenceGateFactor: 0.5,
    savingRollCharismaFactor: 0.5,
    redundancyRiskPerCharisma: 0.15,
    redundancyPhase: 3,
    deathThresholds: {
      obsolescenceDay: 365,
      redundancyDay: 400,
    },
    // A stat at or below this is one negative hit from the saving-roll floor
    dangerThreshold: 2,
    // Inventory and carry-over caps
    consumableCap: 2,          // consumables held in a run (and in the carry-over pool)
    equipmentCarryOverCap: 1,  // equipment carried into the next run
    // Days advanced per event (inclusive range)
    dayAdvance: { min: 3, max: 7 },
    // Extra equipment drop chance per LUCK point, added to dropRate
    luckDropBonusPerPoint: 0.03,
    // Consumables offered when choosing (level up, end of run)
    randomConsumableChoices: 3,
    // Career log: cap on stored entries, and how many each view shows
    careerLog: { cap: 50, sidePanel: 20, recent: 3, popup: 50 },
  },
};
