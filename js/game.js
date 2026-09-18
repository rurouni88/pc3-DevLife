// Core game engine
const Game = {
  state: null,
  
  // Initialize a new game
  createCharacter(statAlloc, startingConsumables = [], startingEquipment = []) {
    const now = Date.now();
    this.state = {
      stats: { ...statAlloc },
      equipment: [...startingEquipment.slice(0, 1)], // carry-over equipment (max 1)
      consumables: [...startingConsumables.slice(0, 2)], // carry-over consumables (max 2)
      level: 1,
      levelUpPoints: 0,
      day: 1,
      phase: 1,
      eventsCompleted: 0,
      currentEventId: null,
      eventHistory: [],
      bossCompleted: false, // tracks if phase boss has been defeated
      careerLog: [{ message: 'Career started.', day: 1, timestamp: now }],
      alive: true,
      won: false,
      startTime: now,
      runNumber: this.getRunNumber() + 1
    };
    return this.state;
  },
  
  // Get run number from meta
  getRunNumber() {
    const meta = JSON.parse(localStorage.getItem('devlife_meta') || '{}');
    return meta.totalRuns || 0;
  },
  
  // Save run completion to meta
  saveRunComplete() {
    const meta = JSON.parse(localStorage.getItem('devlife_meta') || '{}');
    meta.totalRuns = (meta.totalRuns || 0) + 1;
    meta.lastRunDate = new Date().toISOString();
    
    // Save equipment to carry over (max 1)
    if (this.state.equipment.length > 0) {
      if (!meta.startingEquipment) meta.startingEquipment = [];
      const equip = this.state.equipment[0];
      // Only save if we don't already have it
      if (!meta.startingEquipment.includes(equip.id)) {
        meta.startingEquipment.push(equip.id);
      }
    }
    
    // Unlock Prototype King after 3 careers
    if (!meta.unlockedArchetypes) meta.unlockedArchetypes = [];
    if (meta.totalRuns >= 3 && !meta.unlockedArchetypes.includes('prototype_king')) {
      meta.unlockedArchetypes.push('prototype_king');
    }
    
    localStorage.setItem('devlife_meta', JSON.stringify(meta));
  },
  
  // Check if character can level up (every N events = 1 level)
  checkLevelUp() {
    const eventsNeeded = this.state.level * EVENTS_PER_BOSS;
    if (this.state.eventsCompleted >= eventsNeeded && this.state.levelUpPoints === 0) {
      this.state.level++;
      this.state.levelUpPoints = 1;
      this.addLog(`Level up! Now level ${this.state.level}.`);
      
      // Generate 3 random consumables for selection
      this.state.pendingLevelUpConsumables = get3RandomConsumables();
      
      return true;
    }
    return false;
  },
  
  // Process an event choice
  processChoice(gameEvent, choiceIndex) {
    const eventDef = EVENTS.find(e => e.id === gameEvent.id);
    if (!eventDef) return { error: 'Event not found' };
    
    const choice = eventDef.choices[choiceIndex];
    if (!choice) return { error: 'Invalid choice' };
    
    // Resolve stat checks and apply consequences
    const checkResult = this.resolveStatChecks(choice);
    
    // Apply stat effects and log the outcome
    const effects = checkResult.allSuccess ? choice.success.effects : choice.failure.effects;
    const log = checkResult.allSuccess ? choice.success.log : choice.failure.log;
    this.applyEffects(effects);
    
    // Award loot if successful
    const itemDropped = this.checkForEquipmentDrop(checkResult.allSuccess);
    
    // Advance game state
    this.state.day += Math.floor(Math.random() * 5) + 3;
    this.state.eventsCompleted++;
    this.state.currentEventId = gameEvent.id;
    this.state.eventHistory.push(gameEvent.id);
    this.addLog(log);
    
    // Track boss defeat
    const isBoss = eventDef.title.startsWith(BOSS_PREFIX);
    if (isBoss) {
      this.state.bossCompleted = true;
    }
    
    // Check progression milestones
    const phaseComplete = this.checkPhaseCompletion();
    const leveledUp = this.checkLevelUp();
    const gameOver = this.checkGameOver();
    const victory = this.checkVictory();
    
    return {
      success: checkResult.allSuccess,
      checkResults: checkResult.results,
      effects,
      log,
      itemDropped,
      equipmentDropped: !!this.state.pendingEquipmentDrop,
      leveledUp,
      gameOver,
      phaseComplete,
      victory,
      bossDefeated: isBoss
    };
  },
  
  // Resolve stat checks for a choice
  resolveStatChecks(choice) {
    const results = [];
    let allSuccess = true;
    
    if (choice.checks) {
      for (const [stat, target] of Object.entries(choice.checks)) {
        const effective = SpecialSystem.effective(stat);
        const L = SpecialSystem.stats.L;
        const roll = d20() - L;
        const success = roll <= target && effective >= (target - L) * CONFIG.game.competenceGateFactor;
        
        results.push({ stat, roll, target, effective, success });
        if (!success) allSuccess = false;
      }
    }
    
    // Consumable bonuses are one-time — clear after stat check resolves
    SpecialSystem.clearTempBonuses();
    
    return { allSuccess, results };
  },
  
  // Apply stat effects from choice outcome
  applyEffects(effects) {
    for (const [stat, value] of Object.entries(effects)) {
      if (SpecialSystem.stats[stat] !== undefined) {
        SpecialSystem.stats[stat] = Math.max(CONFIG.stats.min, Math.min(CONFIG.stats.max, SpecialSystem.stats[stat] + value));
      }
    }
  },
  
  // Check for equipment drop and handle inventory
  checkForEquipmentDrop(isSuccess) {
    if (!isSuccess || Math.random() >= CONFIG.game.dropRate) {
      return null;
    }
    
    const droppedItem = getRandomEquipment();
    
    if (this.state.equipment.length >= 1) {
      // Inventory full — flag for player choice
      this.state.pendingEquipmentDrop = { ...droppedItem };
      return null;
    }
    
    // Add to inventory and apply bonuses
    this.state.equipment.push({
      id: droppedItem.id,
      name: droppedItem.name,
      emoji: droppedItem.emoji,
      effects: droppedItem.effects
    });
    SpecialSystem.addEquipment(droppedItem.emoji, droppedItem.effects);
    
    return droppedItem;
  },
  
  // Check if career phase is complete
  checkPhaseCompletion() {
    return this.state.phase < 4 && this.state.bossCompleted;
  },
  
  // Check if player has reached victory condition
  checkVictory() {
    return this.state.phase === 4 && this.state.bossCompleted;
  },
  
  // Check game over conditions
  checkGameOver() {
    // Deterministic checks first; fall back to probabilistic ones only if
    // no deterministic death fired.
    return this._checkDeterministicGameOver() || this._checkProbabilisticGameOver();
  },
  
  // Deterministic terminal conditions: a stat on its floor (1) would end the run,
  // unless a saving roll (d20 vs LUCK + 0.5*CHARISMA) succeeds.
  _checkDeterministicGameOver() {
    const careerState = this.state;
    const stats = SpecialSystem.stats;
    
    // Find the first deterministic death condition met (order preserved).
    let death = null;
    if (stats.S <= 1) {
      death = { log: 'Technical collapse! You could no longer carry the code.', reason: '💀 Technical Collapse — You couldn\'t keep up with the technical demands. The codebase won, and your career didn\'t survive the merge.' };
    } else if (stats.P <= 1) {
      death = { log: 'You lost the plot — the system became incomprehensible.', reason: '💀 Lost in the Stack — You could no longer understand the system. Every bug was a mystery and every review a guess, until there was nowhere left to debug to.' };
    } else if (stats.E <= 1) {
      death = { log: 'Burnout! You collapsed from exhaustion.', reason: '💀 Burnout — Your body and mind gave out. Too many late nights and unsustainable pace.' };
    } else if (stats.C <= 1) {
      death = { log: 'Imposter syndrome overwhelmed you.', reason: '💀 Imposter Syndrome — You can\'t function in the industry anymore. The self-doubt was too much.' };
    } else if (stats.I <= 1 && careerState.day > CONFIG.game.deathThresholds.obsolescenceDay) {
      death = { log: 'Your skills became obsolete.', reason: '💀 Skill Obsolescence — You couldn\'t adapt. The industry moved on without you.' };
    } else if (stats.A <= 1) {
      death = { log: 'Velocity hit zero — you could no longer ship.', reason: '💀 Velocity Zero — You couldn\'t deliver fast enough. Every sprint slipped and every deadline passed, and the team moved on without you.' };
    } else if (stats.L <= 1) {
      death = { log: 'Your luck ran out — everything you touched broke.', reason: '💀 Bad Luck Runs Out — Every deploy broke and every guess was wrong. The universe finally stopped favoring you.' };
    }
    
    // No stat on the floor — no deterministic death pending.
    if (!death) return null;
    
    // Attempt the saving roll.
    const target = stats.L + CONFIG.game.savingRollCharismaFactor * stats.C;
    const roll = d20();
    if (roll <= target) {
      // Survived: claw every floored stat back up by 1. This also acts as the
      // cooldown — no stat is on the floor again until one drops there.
      for (const key of STAT_KEYS) {
        if (stats[key] <= 1) stats[key] += 1;
      }
      this.addLog(`🎲 Saving roll: ${roll} vs ${target} — survived. Your luck and ability to bullsh*t keeps you around.`);
      return null;
    }
    
    // Save failed: career over.
    this.addLog(death.log);
    return { reason: death.reason };
  },
  
  // Probabilistic terminal conditions: chance-based deaths.
  _checkProbabilisticGameOver() {
    const careerState = this.state;
    const stats = SpecialSystem.stats;
    
    // Redundancy risk scales with low Charisma in mid/late career
    if (careerState.phase >= CONFIG.game.redundancyPhase && stats.C <= 2 && careerState.day > CONFIG.game.deathThresholds.redundancyDay) {
      const redundancyRoll = Math.random();
      const risk = (3 - stats.C) * CONFIG.game.redundancyRiskPerCharisma;
      if (redundancyRoll < risk) {
        this.addLog('You\'ve been made redundant.');
        return { reason: '💀 Made Redundant — Low visibility, weak relationships, and the axe fell. The severance package was... adequate.' };
      }
    }
    
    return null;
  },
  
  // Advance to next phase
  advancePhase() {
    this.state.phase++;
    this.state.bossCompleted = false;
    const phaseNames = ['', 'Junior Developer', 'Mid-Level Developer', 'Senior Developer', 'Staff/Principal'];
    this.addLog(`Promoted to ${phaseNames[this.state.phase]}! 🎉`);
  },
  
  // Add to career log
  addLog(message) {
    this.state.careerLog.unshift({ message, day: this.state.day, timestamp: Date.now() });
    if (this.state.careerLog.length > 50) {
      this.state.careerLog.pop();
    }
  },
  
  // Get career summary
  getSummary() {
    const duration = Math.floor((Date.now() - this.state.startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const hours = Math.floor(minutes / 60);
    
    return {
      runNumber: this.state.runNumber,
      level: this.state.level,
      phase: this.state.phase,
      day: this.state.day,
      eventsCompleted: this.state.eventsCompleted,
      equipment: this.state.equipment,
      stats: { ...SpecialSystem.stats },
      duration: `${hours}h ${minutes % 60}m`
    };
  },
  
  // Check if save exists
  hasSave() {
    return localStorage.getItem('devlife_save') !== null;
  },
  
  // Get save data
  getSave() {
    const data = localStorage.getItem('devlife_save');
    if (!data) return null;
    return JSON.parse(data);
  },
  
  // Set save data
  setSave(state) {
    localStorage.setItem('devlife_save', JSON.stringify(state));
  },
  
  // Clear save
  clearSave() {
    localStorage.removeItem('devlife_save');
  }
};

// Consumable management
const ConsumableManager = {
  use(consumableId) {
    const inventoryIndex = Game.state.consumables.findIndex(c => c.id === consumableId);
    if (inventoryIndex === -1) return null;
    
    const consumable = Game.state.consumables[inventoryIndex];
    Game.state.consumables.splice(inventoryIndex, 1);
    
    const effect = {
      id: consumable.id,
      name: consumable.name,
      emoji: consumable.emoji,
      stat: consumable.stat,
      bonus: consumable.bonus
    };
    
    if (consumable.multiplier !== undefined) {
      // AI tools have 30% chance to backfire
      const roll = Math.random();
      if (roll > 0.3) {
        effect.multiplier = consumable.multiplier;
        effect.effective = `+${Math.round((consumable.multiplier - 1) * 100)}% stat multiplier`;
        effect.backfired = false;
      } else {
        effect.multiplier = -0.5;
        effect.effective = 'AI backfired! -50% stat';
        effect.backfired = true;
      }
    }
    
    return effect;
  },
  
  count(consumableId) {
    return Game.state.consumables.filter(c => c.id === consumableId).length;
  },
  
  hasAny() {
    return Game.state.consumables.length > 0;
  },
  
  getEndOfRunOptions() {
    return get3RandomConsumables();
  }
};
