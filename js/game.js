// Core game engine
const Game = {
  state: null,
  
  // Initialize a new game
  createCharacter(statAlloc, startingConsumables = []) {
    const now = Date.now();
    this.state = {
      stats: { ...statAlloc },
      equipment: [],
      consumables: [...startingConsumables], // carry-over consumables
      level: 1,
      levelUpPoints: 0,
      day: 1,
      phase: 1,
      eventsCompleted: 0,
      eventsPerPhase: 4, // events before boss
      currentEventId: null,
      eventHistory: [],
      careerLog: ['Career started.'],
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
    
    // Unlock Prototype King after 3 careers
    if (!meta.unlockedArchetypes) meta.unlockedArchetypes = [];
    if (meta.totalRuns >= 3 && !meta.unlockedArchetypes.includes('prototype_king')) {
      meta.unlockedArchetypes.push('prototype_king');
    }
    
    localStorage.setItem('devlife_meta', JSON.stringify(meta));
  },
  
  // Check if character can level up
  checkLevelUp() {
    const eventsNeeded = this.state.level * this.state.eventsPerPhase;
    if (this.state.eventsCompleted >= eventsNeeded && this.state.levelUpPoints === 0) {
      this.state.level++;
      this.state.levelUpPoints = 1;
      this.addLog(`Level up! Now level ${this.state.level}.`);
      return true;
    }
    return false;
  },
  
  // Process an event choice
  processChoice(event, choiceIndex) {
    const eventDef = EVENTS.find(e => e.id === event.id);
    if (!eventDef) return { error: 'Event not found' };
    
    const choice = eventDef.choices[choiceIndex];
    if (!choice) return { error: 'Invalid choice' };
    
    // Perform stat checks
    let allSuccess = true;
    const checkResults = [];
    
    if (choice.checks) {
      for (const [stat, target] of Object.entries(choice.checks)) {
        const effective = SpecialSystem.effective(stat);
        const roll = Math.floor(Math.random() * 20) + 1;
        const success = roll <= target && effective >= target * 0.5; // Need both roll AND stat
        
        checkResults.push({ stat, roll, target, effective, success });
        if (!success) allSuccess = false;
      }
    }
    
    // Clear any temporary bonuses (consumables) after check
    SpecialSystem.clearTempBonuses();
    
    // Apply effects
    const effects = allSuccess ? choice.success.effects : choice.failure.effects;
    const log = allSuccess ? choice.success.log : choice.failure.log;
    
    for (const [stat, value] of Object.entries(effects)) {
      if (SpecialSystem.stats[stat] !== undefined) {
        SpecialSystem.stats[stat] = Math.max(1, Math.min(10, SpecialSystem.stats[stat] + value));
      }
    }
    
    // Random item drop (15% chance on success)
    let itemDropped = null;
    if (allSuccess && Math.random() < 0.15) {
      itemDropped = getRandomItem();
      this.state.equipment.push({
        id: itemDropped.id,
        name: itemDropped.name,
        emoji: itemDropped.emoji,
        effects: itemDropped.effects
      });
      SpecialSystem.addEquipment(itemDropped.emoji, itemDropped.effects);
    }
    
    // Advance game state
    this.state.day += Math.floor(Math.random() * 5) + 3;
    this.state.eventsCompleted++;
    this.state.currentEventId = event.id;
    this.state.eventHistory.push(event.id);
    this.addLog(log);
    
    // Check for level up
    const leveledUp = this.checkLevelUp();
    
    // Check for game over conditions
    const gameOver = this.checkGameOver();
    
    // Check for phase completion
    const phaseComplete = this.state.eventsCompleted >= this.state.level * this.state.eventsPerPhase;
    
    // Check for victory (all phases complete)
    const victory = this.state.eventsCompleted >= 20 && this.state.phase >= 4;
    
    return {
      success: allSuccess,
      checkResults,
      effects,
      log,
      itemDropped,
      leveledUp,
      gameOver,
      phaseComplete,
      victory
    };
  },
  
  // Check game over conditions
  checkGameOver() {
    const s = this.state;
    const sp = SpecialSystem;
    
    // Burnout
    if (sp.stats.E <= 0) {
      this.addLog('Burnout! You collapsed from exhaustion.');
      return { reason: '💀 Burnout — Your body and mind gave out. Too many late nights and unsustainable pace.' };
    }
    
    // Imposter syndrome
    if (sp.stats.C <= 0) {
      this.addLog('Imposter syndrome overwhelmed you.');
      return { reason: '💀 Imposter Syndrome — You can\'t function in the industry anymore. The self-doubt was too much.' };
    }
    
    // Skill obsolescence
    if (sp.stats.I <= 0 && s.day > 365) {
      this.addLog('Your skills became obsolete.');
      return { reason: '💀 Skill Obsolescence — You couldn\'t adapt. The industry moved on without you.' };
    }
    
    // Too many failures
    const recentFailures = s.eventHistory.slice(-5);
    // Could add more sophisticated failure tracking
    
    return null;
  },
  
  // Advance to next phase
  advancePhase() {
    this.state.phase++;
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
  // Use a consumable — returns the effect or null if not found
  use(id) {
    const idx = Game.state.consumables.findIndex(c => c.id === id);
    if (idx === -1) return null;
    
    const consumable = Game.state.consumables[idx];
    Game.state.consumables.splice(idx, 1);
    
    const result = {
      id: consumable.id,
      name: consumable.name,
      emoji: consumable.emoji,
      stat: consumable.stat,
      bonus: consumable.bonus
    };
    
    // Handle AI multiplier consumables
    if (consumable.multiplier !== undefined) {
      // AI always has a chance to backfire
      const roll = Math.random();
      const isGood = roll > 0.3; // 70% chance it works, 30% it backfires
      
      if (isGood) {
        result.multiplier = consumable.multiplier;
        result.effective = `+${Math.round((consumable.multiplier - 1) * 100)}% stat multiplier`;
        result.backfired = false;
      } else {
        result.multiplier = -0.5; // AI makes it worse
        result.effective = 'AI backfired! -50% stat';
        result.backfired = true;
      }
    }
    
    return result;
  },
  
  // Get count of specific consumable
  count(id) {
    return Game.state.consumables.filter(c => c.id === id).length;
  },
  
  // Check if player has any consumables
  hasAny() {
    return Game.state.consumables.length > 0;
  },
  
  // Get 3 random consumables for end-of-run selection
  getEndOfRunOptions() {
    return get3RandomConsumables();
  }
};
