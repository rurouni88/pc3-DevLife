// Core game engine
const Game = {
  state: null as GameState | null,

  // Consumable slot cap: base cap + slot bonuses from carried equipment
  // (the Backpack). A run's ending equipment carries over as-is, so this
  // is also the right cap for the next run's starting stash.
  consumableCap(equipment?: Equipment[]): number {
    const items = equipment || (this.state ? this.state.equipment : []);
    return CONFIG.game.consumableCap + items.reduce((sum, item) => sum + (item.consumableSlots || 0), 0);
  },

  // Initialize a new game. Difficulty is fixed at run start (issue #6) and
  // defaults to easy.
  createCharacter(statAlloc: Stats, startingConsumables: Consumable[] = [], startingEquipment: Equipment[] = [], difficulty: Difficulty = 'easy'): GameState {
    const now = Date.now();
    const state: GameState = {
      stats: { ...statAlloc },
      equipment: [...startingEquipment.slice(0, CONFIG.game.equipmentCarryOverCap)], // carry-over equipment
      // Carry-over consumables: the LAST `cap` in the pool — the pool grows
      // by append, so most recent picks are granted, not the oldest. The cap
      // includes slot bonuses from the carried equipment (Backpack).
      consumables: [...startingConsumables.slice(-this.consumableCap(startingEquipment))],
      difficulty,
      // Fixed at character creation from the final stat allocation — this is
      // what the starting-archetype achievements and the summary screen use.
      archetype: classifyArchetype(statAlloc),
      level: 1,
      levelUpPoints: 0,
      day: 1,
      phase: 1,
      eventsCompleted: 0,
      consumablesUsed: 0,
      currentEventId: null,
      eventHistory: [],
      bossCompleted: false, // tracks if phase boss has been defeated
      careerLog: [{ message: 'Career started.', day: 1, timestamp: now }],
      alive: true,
      won: false,
      startTime: now,
      runNumber: this.getRunNumber() + 1,
      seed: RngEngine.seed || ''
    };
    this.state = state;
    // Carry-over equipment grants its bonuses from day 1 (mid-run drops
    // and swaps apply their own — see checkForEquipmentDrop / UI)
    state.equipment.forEach(item => SpecialSystem.addEquipment(item.emoji, item.effects));
    return state;
  },

  // Get run number from meta
  getRunNumber(): number {
    return MetaStore.runCount();
  },

  // Save run completion to meta
  saveRunComplete(): void {
    const state = this.state;
    if (!state) return;
    const firstEquipment = state.equipment[0];
    // Base stats at run end (not effective — equipment bonuses are a
    // separate stat and would skew the per-stat averages).
    MetaStore.recordRunComplete(firstEquipment ? firstEquipment.id : null, {
      won: state.won,
      day: state.day,
      difficulty: state.difficulty,
      consumablesUsed: state.consumablesUsed,
      stats: { ...state.stats },
    }, state.seed, state.archetype);
  },

  // Check if character can level up (every N events = 1 level)
  checkLevelUp(): boolean {
    const state = this.state;
    if (!state) return false;
    const eventsNeeded = state.level * PerkSystem.bossInterval();
    if (state.eventsCompleted >= eventsNeeded && state.levelUpPoints === 0) {
      state.level++;
      // 🧠 Rapid Learner: +1 bonus level up point
      state.levelUpPoints = PerkSystem.levelUpPoints();
      this.addLog(`Level up! Now level ${state.level}.`);

      // Generate 3 random consumables for selection
      state.pendingLevelUpConsumables = get3RandomConsumables();

      return true;
    }
    return false;
  },

  // Phase 1 of choice processing: resolve the stat checks and determine
  // which perk interventions the player may choose. No persistent side
  // effects — effects, loot, days, and milestones all happen in
  // applyChoice(), AFTER the player has decided. (Clean Deploy is the
  // exception: it is automatic and fires here, at roll time.)
  resolveChoice(gameEvent: GameEvent, choiceIndex: number): ResolvedChoice | { error: string } {
    const eventDef = EVENTS.find(e => e.id === gameEvent.id);
    if (!eventDef) return { error: 'Event not found' };

    const choice = eventDef.choices[choiceIndex];
    if (!choice) return { error: 'Invalid choice' };

    if (!this.state) return { error: 'No active run' };

    const checkResult = this.resolveStatChecks(choice);

    // Intervention availability is frozen here, before any effects are
    // applied — applyChoice() is what applies them, so a failure's own
    // effects (which may drop a stat and revoke the perk) cannot steal the
    // intervention that was earned when the check resolved.
    const failureHasNegatives = Object.values(choice.failure.effects).some(v => (v || 0) < 0);

    return {
      gameEvent,
      choice,
      isBoss: eventDef.title.startsWith(BOSS_PREFIX),
      checkResults: checkResult.results,
      allSuccess: checkResult.allSuccess,
      cleanDeployUsed: checkResult.cleanDeployUsed,
      interventions: {
        negotiate: checkResult.hasNegotiate,
        bruteForce: checkResult.hasBruteForce,
        codeReview: !checkResult.allSuccess && failureHasNegatives && PerkSystem.canUseCodeReview()
      }
    };
  },

  // Phase 2: apply the outcome with the player's intervention decisions.
  // Negotiate converts the failure to a success; Brute Force re-evaluates
  // the failed Strength check at +2 (success if all checks now pass);
  // Code Review halves the negative effects at apply time — no retroactive
  // refund. A perk is consumed only if its intervention actually applies
  // (e.g. Code Review is not spent when Negotiate already won the event).
  applyChoice(resolved: ResolvedChoice, use: PerkDecisions = { negotiate: false, bruteForce: false, codeReview: false }): ProcessResult {
    const state = this.state;
    if (!state) throw new Error('Game not initialized');

    // A pending drop from a prior event that was never resolved (e.g. the
    // run ended before the choice screen) must not leak into this result's
    // equipmentDropped flag — checkForEquipmentDrop() re-sets it below
    state.pendingEquipmentDrop = null;

    // Final outcome: interventions may convert the failure
    const checkResults = resolved.checkResults.map(cr => ({ ...cr }));
    let success = resolved.allSuccess;

    if (!success && use.negotiate && resolved.interventions.negotiate) {
      PerkSystem.useNegotiate();
      success = true;
      checkResults.forEach(cr => { cr.negotiated = true; });
      this.addLog('🤝 Negotiate! You talked your way out of it.');
    } else if (!success && use.bruteForce && resolved.interventions.bruteForce) {
      PerkSystem.useBruteForce();
      checkResults.forEach(cr => {
        if (cr.stat === 'S' && !cr.success) {
          cr.target = PerkSystem.applyBruteForce(cr.target);
          cr.success = cr.roll <= cr.target;
        }
      });
      if (checkResults.every(cr => cr.success)) success = true;
      this.addLog('💪 Brute Force! +2 to the Strength check target.');
    }

    // Effects for the final outcome; Code Review halves the negatives now
    let effects = success ? resolved.choice.success.effects : resolved.choice.failure.effects;
    // Difficulty (issue #6): a failed outcome's negative effects are
    // multiplied by a d(negMultSides) roll. Applied before Code Review so the
    // perk mitigates the already-harder blow (more value on higher difficulty).
    // Easy is d1 (×1) — a no-op, so it's skipped.
    if (!success) {
      const diff = CONFIG.game.difficulty[state.difficulty];
      if (diff && diff.negMultSides > 1) {
        const mult = dRoll(diff.negMultSides);
        const scaled: Partial<Stats> = {};
        for (const [stat, value] of Object.entries(effects) as [StatKey, number][]) {
          scaled[stat] = value < 0 ? value * mult : value;
        }
        effects = scaled;
        this.addLog(`⚠️ ${diff.label} difficulty: negative effects ×${mult}.`);
      }
    }
    if (!success && use.codeReview && resolved.interventions.codeReview) {
      PerkSystem.useCodeReview();
      const halved: Partial<Stats> = {};
      for (const [stat, value] of Object.entries(effects) as [StatKey, number][]) {
        halved[stat] = value < 0 ? PerkSystem.applyCodeReview(value) : value;
      }
      effects = halved;
      this.addLog('🐛 Code Review! Negative effects halved.');
    }

    // 🧘 Iron Nerves: once per run, a hit that would floor Endurance stops
    // it at 3 instead. Judged on the final effects (after Code Review),
    // BEFORE anything is applied — the perk was active when the blow
    // landed, even though the effect itself would revoke it. Copies the
    // effects object so the shared event definition is never mutated.
    let ironNervesUsed = false;
    if (PerkSystem.canUseIronNerves()) {
      const eDelta = effects.E || 0;
      if (eDelta < 0 && SpecialSystem.stats.E + eDelta <= 1) {
        effects = { ...effects, E: 3 - SpecialSystem.stats.E };
        PerkSystem.useIronNerves();
        ironNervesUsed = true;
        this.addLog('🧘 Iron Nerves! You push through the collapse.');
      }
    }
    const log = success ? resolved.choice.success.log : resolved.choice.failure.log;
    this.applyEffects(effects);

    // Award loot if successful
    const itemDropped = this.checkForEquipmentDrop(success);

    // Advance game state
    const { min: dayMin, max: dayMax } = CONFIG.game.dayAdvance;
    state.day += dayMin + Math.floor(RngEngine.random() * (dayMax - dayMin + 1));
    state.eventsCompleted++;
    state.currentEventId = resolved.gameEvent.id;
    state.eventHistory.push(resolved.gameEvent.id);
    this.addLog(log);

    // Track boss defeat
    if (resolved.isBoss) {
      state.bossCompleted = true;
    }

    // Check progression milestones
    const phaseComplete = this.checkPhaseCompletion();
    const leveledUp = this.checkLevelUp();
    const gameOver = this.checkGameOver();
    const victory = this.checkVictory();

    // Terminal state flags: a death or the final boss ends the run. Set once,
    // never cleared — used to gate in-run actions like consumable use (#41).
    if (gameOver) state.alive = false;
    if (victory) state.won = true;

    // End of run (death or victory): evaluate achievements against the final
    // state. Newly-unlocked definitions are returned so the UI can toast them.
    const newAchievements = (gameOver || victory) ? Achievements.evaluate(state) : [];

    return {
      success,
      checkResults,
      effects,
      log,
      itemDropped,
      equipmentDropped: !!state.pendingEquipmentDrop,
      leveledUp,
      gameOver,
      phaseComplete,
      victory,
      bossDefeated: resolved.isBoss,
      cleanDeployUsed: resolved.cleanDeployUsed,
      ironNervesUsed,
      newAchievements
    };
  },

  // Resolve stat checks for a choice
  resolveStatChecks(choice: EventChoice): { allSuccess: boolean; results: CheckResult[]; hasNegotiate: boolean; hasBruteForce: boolean; cleanDeployUsed: boolean } {
    const results: CheckResult[] = [];
    let allSuccess = true;
    let cleanDeployUsed = false;

    if (choice.checks) {
      // Event JSON is validated at load, so check keys are always stat letters
      for (const [stat, target] of Object.entries(choice.checks) as [StatKey, number][]) {
        let effective = SpecialSystem.effective(stat);
        const L = SpecialSystem.stats.L;
        let rawRoll = d20();
        let roll = rawRoll - L;
        let checkTarget = target;
        let success = roll <= checkTarget && effective >= (target - L) * CONFIG.game.competenceGateFactor;

        // 🍀 Clean Deploy: once per run, reroll a failed check
        if (!success && PerkSystem.canCleanDeployReroll()) {
          PerkSystem.useCleanDeployReroll();
          cleanDeployUsed = true;
          rawRoll = d20();
          roll = rawRoll - L;
          success = roll <= checkTarget && effective >= (target - L) * CONFIG.game.competenceGateFactor;
          if (success) {
            this.addLog(`🍀 Clean Deploy! Rerolled ${stat}: ${roll} → success`);
          }
        }

        results.push({ stat, roll, rawRoll, target: checkTarget, effective, success });
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

  // Apply stat effects from choice outcome.
  applyEffects(effects: Partial<Stats>): { hasNegativeEffects: boolean } {
    const hasNegativeEffects = Object.entries(effects).some(([_, v]) => (v as number) < 0);

    for (const [stat, value] of Object.entries(effects) as [StatKey, number][]) {
      if (SpecialSystem.stats[stat] === undefined) continue;
      SpecialSystem.stats[stat] = clampStat(SpecialSystem.stats[stat] + value);
    }

    // Stat changes may unlock or revoke perks
    this.refreshPerks();

    return { hasNegativeEffects };
  },

  // Recompute active perks and announce changes
  refreshPerks(): void {
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
  checkForEquipmentDrop(isSuccess: boolean): Equipment | null {
    if (!isSuccess || RngEngine.random() >= Math.min(1, CONFIG.game.dropRate + SpecialSystem.stats.L * CONFIG.game.luckDropBonusPerPoint)) {
      return null;
    }

    const state = this.state;
    if (!state) return null;

    const droppedItem = getRandomEquipment();

    if (state.equipment.length >= 1) {
      // Inventory full — flag for player choice
      state.pendingEquipmentDrop = { ...droppedItem };
      return null;
    }

    // Add to inventory and apply bonuses. Store the full item — the
    // equipment popup renders rarity and desc.
    state.equipment.push({ ...droppedItem });
    SpecialSystem.addEquipment(droppedItem.emoji, droppedItem.effects);

    return droppedItem;
  },

  // Check if career phase is complete
  checkPhaseCompletion(): boolean {
    return !!this.state && this.state.phase < 4 && this.state.bossCompleted;
  },

  // Check if player has reached victory condition
  checkVictory(): boolean {
    return !!this.state && this.state.phase === 4 && this.state.bossCompleted;
  },

  // Stats in immediate danger: at or below the danger threshold, i.e. one
  // negative hit from the saving-roll floor. Uses base stats — equipment
  // bonuses do not protect against the floor (the death check doesn't either).
  dangerStats(): StatKey[] {
    const out: StatKey[] = [];
    for (const key of STAT_KEYS) {
      if (SpecialSystem.stats[key] <= CONFIG.game.dangerThreshold) out.push(key);
    }
    return out;
  },

  // Check game over conditions
  checkGameOver(): { reason: string } | null {
    // Deterministic checks first; fall back to probabilistic ones only if
    // no deterministic death fired.
    return this._checkDeterministicGameOver() || this._checkProbabilisticGameOver();
  },

  // Deterministic terminal conditions: a stat on its floor (1) would end the run,
  // unless a saving roll (d20 vs LUCK + 0.5*CHARISMA) succeeds.
  _checkDeterministicGameOver(): { reason: string } | null {
    const careerState = this.state;
    if (!careerState) return null;
    const stats = SpecialSystem.stats;

    // Find the first deterministic death condition met (order preserved).
    let death: { log: string; reason: string } | null = null;
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
  _checkProbabilisticGameOver(): { reason: string } | null {
    const careerState = this.state;
    if (!careerState) return null;
    const stats = SpecialSystem.stats;

    // Redundancy risk scales with low Charisma in mid/late career
    if (careerState.phase >= CONFIG.game.redundancyPhase && stats.C <= 2 && careerState.day > CONFIG.game.deathThresholds.redundancyDay) {
      const redundancyRoll = RngEngine.random();
      const risk = (3 - stats.C) * CONFIG.game.redundancyRiskPerCharisma;
      if (redundancyRoll < risk) {
        this.addLog('You\'ve been made redundant.');
        return { reason: '💀 Made Redundant — Low visibility, weak relationships, and the axe fell. The severance package was... adequate.' };
      }
    }

    return null;
  },

  // Advance to next phase
  advancePhase(): void {
    const state = this.state;
    if (!state) return;
    state.phase++;
    state.bossCompleted = false;
    this.addLog(`Promoted to ${CONFIG.game.phaseNames[state.phase]}! 🎉`);
  },

  // Pick the next event, advancing the phase first if needed. nextEvent is
  // the single owner of phase advancement — the result screen's continue
  // button relies on this instead of calling advancePhase itself.
  nextEvent(): GameEvent {
    const state = this.state;
    if (!state) throw new Error('Game.nextEvent: no active run');

    // Boss already defeated — advance and pick again
    if (state.bossCompleted) {
      this.advancePhase();
      return this.nextEvent();
    }

    // Boss every N events (eventsCompleted is incremented AFTER the choice
    // that completed the cycle is processed)
    // 🚀 Fast Ship: bosses every 5 events instead of 6
    if ((state.eventsCompleted + 1) % PerkSystem.bossInterval() === 0) {
      const boss = getBossEvent(state.phase);
      if (boss) return boss;
    }

    const event = getRandomNonBossEvent(state.phase, state.eventHistory || []);
    if (event) return event;

    // All non-boss events seen — fall back to the boss
    const fallback = getBossEvent(state.phase);
    if (fallback) return fallback;

    // No events at all for this phase — advance and pick again
    this.advancePhase();
    return this.nextEvent();
  },

  // Add to career log
  addLog(message: string): void {
    const state = this.state;
    if (!state) return;
    state.careerLog.unshift({ message, day: state.day, timestamp: Date.now() });
    if (state.careerLog.length > CONFIG.game.careerLog.cap) {
      state.careerLog.pop();
    }
  },

  // Get career summary
  getSummary(): { runNumber: number; level: number; phase: number; day: number; eventsCompleted: number; equipment: Equipment[]; stats: Stats; duration: string; difficulty: Difficulty; archetype: string; seed: string } | null {
    const state = this.state;
    if (!state) return null;
    const duration = Math.floor((Date.now() - state.startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const hours = Math.floor(minutes / 60);

    return {
      runNumber: state.runNumber,
      level: state.level,
      phase: state.phase,
      day: state.day,
      eventsCompleted: state.eventsCompleted,
      equipment: state.equipment,
      stats: { ...SpecialSystem.stats },
      duration: `${hours}h ${minutes % 60}m`,
      // Old saves may predate the difficulty field — treat those as Easy
      difficulty: state.difficulty ?? 'easy',
      // Old saves may predate the archetype field — treat those as custom
      archetype: state.archetype ?? 'custom',
      // Old saves may predate the seed field — treat those as unseeded
      seed: state.seed || ''
    };
  },
};

// Consumable management
const ConsumableManager = {
  use(consumableId: string): ConsumableUseResult | null {
    const state = Game.state;
    if (!state) return null;
    // The run is over (death or victory) — in-run consumables are inert (#41).
    if (!state.alive || state.won) return null;
    const inventoryIndex = state.consumables.findIndex(c => c.id === consumableId);
    if (inventoryIndex === -1) return null;

    const consumable = state.consumables[inventoryIndex];
    state.consumables.splice(inventoryIndex, 1);
    state.consumablesUsed++;

    const effect: ConsumableUseResult = {
      id: consumable.id,
      name: consumable.name,
      emoji: consumable.emoji,
      stat: consumable.stat,
      bonus: consumable.bonus,
      effects: consumable.effects
    };

    if (consumable.multiplier !== undefined) {
      // AI tools have a 30% chance to backfire
      const roll = RngEngine.random();
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

  // End-of-run options: 3 random consumables the player does NOT already
  // carry — offering a carried item would make the swap a no-op
  getEndOfRunOptions(): Consumable[] {
    const carried = MetaStore.carriedIds('startingConsumables');
    const pool = CONSUMABLES.filter(c => !carried.includes(c.id));
    return shuffle(pool).slice(0, CONFIG.game.randomConsumableChoices);
  }
};
