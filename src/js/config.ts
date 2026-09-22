// Game configuration — all tunable constants in one place
const CONFIG = {
  version: '0.35',
  versionLabel: 'Prototype',

  stats: {
    min: 1,
    max: 10,
    keys: ['S', 'P', 'E', 'C', 'I', 'A', 'L'] as StatKey[],
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
    // Difficulty (issue #6). Fixed at run start. A failed outcome's negative
    // effects are multiplied by a d(negMultSides) roll — easy is d1 (×1, no
    // change). Equipment slots (2) and HARD's extra consumable slot (3) are
    // deferred (issue #6): all difficulties use the default 1 equipment / 2
    // consumable slots for now. HARD is not selectable until those land.
    difficulty: {
      easy:   { label: 'Easy',   negMultSides: 1, desc: 'The “Standard” career. Failures land exactly as written — no cosmic punishment. For your first run, or for when you\u2019re feeling generous with yourself.' },
      normal: { label: 'Normal', negMultSides: 2, desc: 'The “Realistic” career. Failures hit 1–2× harder, rolled on a d2. This is what the industry actually feels like.' },
      hard:   { label: 'Hard',   negMultSides: 4, desc: 'The “Unrealistic” career. Failures hit 1–4× harder, rolled on a d4. For masochists — or anyone who\u2019s been on-call since 2019.', locked: true },
    } as Record<Difficulty, { label: string; negMultSides: number; desc: string; locked?: boolean }>,
  },
};
