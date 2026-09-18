// Game configuration — all tunable constants in one place
const CONFIG = {
  version: '0.20',
  versionLabel: 'Prototype',

  stats: {
    min: 1,
    max: 10,
    keys: ['S', 'P', 'E', 'C', 'I', 'A', 'L'],
    startingPoints: 40,
  },

  game: {
    eventsPerBoss: 6,
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
  },
};
