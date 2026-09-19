// Core game engine
const Game = {
  /** @type {GameState | null} */
  state: null,
  
  // Initialize a new game
  /** @param {Stats} statAlloc @param {Consumable[]} [startingConsumables] @param {Equipment[]} [startingEquipment] @returns {GameState} */
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
    return MetaStore.runCount();
  },
  
  // Save run completion to meta
  saveRunComplete() {
    const firstEquipment = this.state.equipment[0];
    MetaStore.recordRunComplete(firstEquipment ? firstEquipment.id : null);
  },
  
  // Check if character can level up (every N events = 1 level)
  checkLevelUp() {
    const eventsNeeded = this.state.level * PerkSystem.bossInterval();
    if (this.state.eventsCompleted >= eventsNeeded && this.state.levelUpPoints === 0) {
      this.state.level++;
      // 🧠 Rapid Learner: +1 bonus level up point
      this.state.levelUpPoints = PerkSystem.levelUpPoints();
      this.addLog(`Level up! Now level ${this.state.level}.`);
      
      // Generate 3 random consumables for selection
      this.state.pendingLevelUpConsumables = get3RandomConsumables();
      
      return true;
    }
    return false;
  },
  
  // Process an event choice
  /** @param {GameEvent} gameEvent @param {number} choiceIndex @returns {ProcessResult} */
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
    const effectResult = this.applyEffects(effects);
    
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
      bossDefeated: isBoss,
      hasNegotiate: checkResult.hasNegotiate,
      hasBruteForce: checkResult.hasBruteForce,
      hasCodeReview: effectResult.hasNegativeEffects && PerkSystem.canUseCodeReview(),
      cleanDeployUsed: checkResult.cleanDeployUsed
    };
  },
  
  // Resolve stat checks for a choice
  /** @param {EventChoice} choice @returns {{ allSuccess: boolean, results: CheckResult[], hasNegotiate: boolean, hasBruteForce: boolean, cleanDeployUsed: boolean }} */
  resolveStatChecks(choice) {
    const results = [];
    let allSuccess = true;
    let cleanDeployUsed = false;
    
    if (choice.checks) {
      // Event JSON is validated at load, so check keys are always stat letters
      for (const [stat, target] of /** @type {Array<[StatKey, number]>} */ (Object.entries(choice.checks))) {
        let effective = SpecialSystem.effective(stat);
        const L = SpecialSystem.stats.L;
        let roll = d20() - L;
        let checkTarget = target;
        let success = roll <= checkTarget && effective >= (target - L) * CONFIG.game.competenceGateFactor;
        
        // 🍀 Clean Deploy: once per run, reroll a failed check
        if (!success && PerkSystem.canCleanDeployReroll()) {
          PerkSystem.useCleanDeployReroll();
          cleanDeployUsed = true;
          roll = d20() - L;
          success = roll <= checkTarget && effective >= (target - L) * CONFIG.game.competenceGateFactor;
          if (success) {
            this.addLog(`🍀 Clean Deploy! Rerolled ${stat}: ${roll} → success`);
          }
        }
        
        results.push({ stat, roll, target: checkTarget, effective, success });
        if (!success) allSuccess = false;
      }
    }
    
    // 💪 Brute Force: flag for player choice on failed Strength checks
    const hasBruteForce = results.some(r => r.stat === 'S' && !r.success) && PerkSystem.canUseBruteForce();
    
    // 🤝 Negotiate: flag for player choice (not auto-used)
    const hasNegotiate = !allSuccess && PerkSystem.canNegotiate();
    
    // Consumable bonuses are one-time — clear after stat check resolves
    SpecialSystem.clearTempBonuses();
    
    return { allSuccess, results, hasNegotiate, hasBruteForce, cleanDeployUsed };
  },
  
  // Use Negotiate perk after event result. Cosmetic: effects were already
  // applied, but the displayed result flips to success.
  /** @param {ProcessResult} result @returns {boolean} */
  useNegotiate(result) {
    if (!PerkSystem.canNegotiate()) return false;
    PerkSystem.useNegotiate();
    result.success = true;
    (result.checkResults || []).forEach(cr => { cr.negotiated = true; });
    this.addLog('🤝 Negotiate! You talked your way out of it.');
    return true;
  },
  
  // 💪 Brute Force: re-evaluate the failed Strength check with a +2 target.
  // Cosmetic: effects were already applied, but the displayed check (and
  // success state, if all checks now pass) is updated.
  /** @param {ProcessResult} result @returns {boolean} */
  useBruteForce(result) {
    if (!PerkSystem.canUseBruteForce()) return false;
    PerkSystem.useBruteForce();
    
    (result.checkResults || []).forEach(cr => {
      if (cr.stat === 'S' && !cr.success) {
        cr.target = PerkSystem.applyBruteForce(cr.target);
        cr.success = cr.roll <= cr.target;
      }
    });
    
    if (result.checkResults.length > 0 && result.checkResults.every(cr => cr.success)) {
      result.success = true;
    }
    
    this.addLog('💪 Brute Force! +2 to the Strength check target.');
    return true;
  },
  
  // 🐛 Code Review: retroactively halve this outcome's negative effects
  // (the full effects were already applied by applyEffects). Edge case:
  // if a stat was clamped at the min, the correction may over-restore by
  // the clamped amount — accepted as rare.
  /** @param {ProcessResult} result @returns {boolean} */
  useCodeReview(result) {
    if (!PerkSystem.canUseCodeReview() || !result.effects) return false;
    PerkSystem.useCodeReview();
    
    for (const [stat, value] of Object.entries(result.effects)) {
      if (value < 0 && SpecialSystem.stats[stat] !== undefined) {
        const correction = PerkSystem.applyCodeReview(value) - value; // e.g. -2 - (-4) = +2
        SpecialSystem.stats[stat] = Math.max(CONFIG.stats.min, Math.min(CONFIG.stats.max, SpecialSystem.stats[stat] + correction));
      }
    }
    
    this.refreshPerks();
    this.addLog('🐛 Code Review! Negative effects halved.');
    return true;
  },
  
  // Apply stat effects from choice outcome. Negative effects are applied in
  // full — Code Review (player choice) may retroactively halve them via
  // useCodeReview().
  /** @param {Partial<Stats>} effects @returns {{ hasNegativeEffects: boolean }} */
  applyEffects(effects) {
    const hasNegativeEffects = Object.entries(effects).some(([_, v]) => v < 0);
    
    for (const [stat, value] of Object.entries(effects)) {
      if (SpecialSystem.stats[stat] === undefined) continue;
      SpecialSystem.stats[stat] = Math.max(CONFIG.stats.min, Math.min(CONFIG.stats.max, SpecialSystem.stats[stat] + value));
    }
    
    // Stat changes may unlock or revoke perks
    this.refreshPerks();
    
    return { hasNegativeEffects };
  },
  
  // Recompute active perks and announce changes
  refreshPerks() {
    const { gained, lost } = PerkSystem.refresh();
    gained.forEach(id => {
      const perk = PERK_BY_ID[id];
      UI.showToast(`🏅 Perk Unlocked: ${perk.emoji} ${perk.name}`, 'success');
      this.addLog(`🏅 Perk unlocked: ${perk.name} — ${perk.desc}`);
    });
    lost.forEach(id => {
      const perk = PERK_BY_ID[id];
      UI.showToast(`💔 Perk Lost: ${perk.emoji} ${perk.name}`, 'error');
      this.addLog(`💔 Perk lost: ${perk.name}`);
    });
    if (gained.length > 0 || lost.length > 0) {
      UI.renderPerks();
    }
  },
  
  // Check for equipment drop and handle inventory
  checkForEquipmentDrop(isSuccess) {
    if (!isSuccess || Math.random() >= Math.min(1, CONFIG.game.dropRate + SpecialSystem.stats.L * 0.03)) {
      return null;
    }
    
    const droppedItem = getRandomEquipment();
    
    if (this.state.equipment.length >= 1) {
      // Inventory full — flag for player choice
      this.state.pendingEquipmentDrop = { ...droppedItem };
      return null;
    }
    
    // Add to inventory and apply bonuses. Store the full item — the
    // equipment popup renders rarity and desc.
    this.state.equipment.push({ ...droppedItem });
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
    } else if (stats.E <= 1 && !PerkSystem.has('iron_nerves')) {
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
  /** @param {string} message */
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
      // AI tools have a 30% chance to backfire
      const roll = Math.random();
      if (roll > 0.30) {
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
  
  getEndOfRunOptions() {
    return get3RandomConsumables();
  }
};
