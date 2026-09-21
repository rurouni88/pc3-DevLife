// Shared DOM helpers — the UI is static HTML, but the type system
// doesn't know that, so these narrow once and reuse.
/** @param {string} id @param {string} display */
const setDisplay = (id, display) => {
  const el = document.getElementById(id);
  if (el) el.style.display = display;
};
/** @param {string} id @param {string} text */
const setText = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

// Perk intervention prompts — one per available perk. Shared by the
// pending decision screen (renderPerkDecision).
/** @param {string} perkId @param {string} yesId @param {string} noId @param {string} useLabel @returns {string} */
const perkPromptBox = (perkId, yesId, noId, useLabel) => {
  const perk = PERK_BY_ID[perkId];
  return `
    <div class="perk-prompt-box">
      <div class="perk-prompt-title">⚡ Intervene with Perk</div>
      <div class="perk-prompt-desc">${perk.emoji} <strong>${perk.name}</strong> — ${perk.desc}</div>
      <div class="perk-prompt-actions">
        <button class="btn btn-primary" id="${yesId}">${useLabel}</button>
        <button class="btn btn-ghost" id="${noId}">No, thanks</button>
      </div>
    </div>
  `;
};

// Intervention key → perk id (PERK_BY_ID) and prompt label
const INTERVENTION_META = {
  negotiate: { perkId: 'negotiate', label: '🤝 Use Negotiate' },
  bruteForce: { perkId: 'brute_force', label: '💪 Use Brute Force' },
  codeReview: { perkId: 'code_review', label: '🐛 Use Code Review' }
};

// UI — core: screens, toasts/audio, event & result rendering, popups.
// Section files (ui-character, ui-levelup, ui-endofrun) load first; this
// file composes them into UI at the bottom.
const UICore = {
  currentScreen: 'title',
  
  // Audio context for sound effects
  /** @type {AudioContext | null} */
  audioCtx: null,
  
  // Initialize audio (must be called after user interaction)
  initAudio() {
    if (UI.audioCtx) return;
    UI.audioCtx = new (window.AudioContext || (/** @type {any} */ (window)).webkitAudioContext)();
  },
  
  // Play a sound effect
  /** @param {string} type */
  playSound(type) {
    if (!UI.audioCtx) UI.initAudio();
    if (!UI.audioCtx) return;
    
    const ctx = UI.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    switch (type) {
      case 'click':
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.1, now);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
        
      case 'success':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        osc.frequency.setValueAtTime(784, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
        
      case 'failure':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
        
      case 'levelup':
        osc.type = 'sine';
        [523, 659, 784, 1047].forEach((freq, i) => {
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
        });
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
        
      case 'boss':
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
        
      case 'gameover':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(100, now + 1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
        osc.start(now);
        osc.stop(now + 1);
        break;
        
      case 'perk':
        // Distinctive high two-note ping — a perk intervention fired
        osc.type = 'sine';
        osc.frequency.setValueAtTime(988, now);
        osc.frequency.setValueAtTime(1319, now + 0.09);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
        
      case 'victory':
        osc.type = 'sine';
        [523, 659, 784, 1047, 784, 1047].forEach((freq, i) => {
          osc.frequency.setValueAtTime(freq, now + i * 0.15);
        });
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
        osc.start(now);
        osc.stop(now + 1);
        break;
    }
  },
  
  // Flash screen with color
  /** @param {string} color @param {number} [duration] */
  flashScreen(color, duration = 300) {
    const flash = document.createElement('div');
    flash.className = 'screen-flash';
    flash.style.backgroundColor = color;
    document.body.appendChild(flash);
    
    setTimeout(() => flash.remove(), duration);
  },
  
  // Show toast notification
  /** @param {string} message @param {string} [type] */
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
  },
  
  // Show item tooltip (consumables, equipment, perks)
  /** @param {{ emoji?: string, name?: string, desc?: string, stat?: string, bonus?: number, multiplier?: number, effects?: Partial<Stats>, consumableSlots?: number }} item */
  showTooltip(item) {
    const tooltip = document.getElementById('item-tooltip');
    if (!tooltip) return;
    
    /** @param {string} sel @param {string} text */
    const setTooltipText = (sel, text) => {
      const el = tooltip.querySelector(sel);
      if (el) el.textContent = text;
    };
    setTooltipText('.tooltip-emoji', item.emoji || '');
    setTooltipText('.tooltip-name', item.name || '');
    setTooltipText('.tooltip-desc', item.desc || '');
    
    // Build effect text (only for consumables/equipment, not perks)
    let effectText = '';
    if (item.stat && item.bonus) {
      effectText = `+${item.bonus} ${item.stat === 'any' ? 'ANY stat' : STAT_META[/** @type {StatKey} */ (item.stat)]?.name || item.stat}`;
    } else if (item.multiplier) {
      effectText = `${item.multiplier}× stat (risky)`;
    } else if (item.effects || item.consumableSlots) {
      effectText = equipmentEffectText(item);
    }
    const effectEl = /** @type {HTMLElement} */ (tooltip.querySelector('.tooltip-effect'));
    effectEl.textContent = effectText;
    effectEl.style.display = effectText ? 'block' : 'none';
    
    tooltip.style.display = 'block';
  },
  
  hideTooltip() {
    const tooltip = document.getElementById('item-tooltip');
    if (tooltip) tooltip.style.display = 'none';
  },
  
  // Initialize tooltip close handler
  initTooltipClose() {
    const tooltip = document.getElementById('item-tooltip');
    if (!tooltip) return;
    
    // Close tooltip when clicking on it
    tooltip.addEventListener('click', (e) => {
      e.stopPropagation();
      UI.hideTooltip();
    });
    
    // Close tooltip when clicking outside
    document.addEventListener('click', (e) => {
      if (tooltip.style.display === 'none') return;
      const target = /** @type {Element} */ (e.target);
      if (tooltip.contains(target)) return;
      if (target.classList.contains('cons-info')) return;
      UI.hideTooltip();
    });
    
    // Close popup when clicking close button or overlay
    document.addEventListener('click', (e) => {
      if ((/** @type {Element} */ (e.target)).classList.contains('popup-close')) {
        UI.closePopup();
      }
      const activePopup = document.querySelector('.popup-panel.active');
      if (activePopup && e.target === activePopup) {
        UI.closePopup();
      }
    });
  },
  
  // Satirical ASCII loop on the title screen (pauses while hidden)
  startAsciiLoop() {
    const el = document.getElementById('ascii-terminal-body');
    if (!el) return;
    const scenes = [
      ['$ deploy --friday', 'building... done', 'tests... skipped', 'prod: ON FIRE', 'you: "it\'s a feature"'],
      ['lead: blockers?', 'you: none!', '(47 tabs, 1 coffee)', 'lead: great energy', 'you: ██████░░░░ 60%'],
      ['Junior ──────> Staff', 'promotion: pending', 'budget: -30%', 'you: still here??', '...legend.']
    ];
    /** @param {number} ms */
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      for (;;) {
        for (const scene of scenes) {
          while (!el.offsetParent) await sleep(500);
          el.textContent = '';
          for (const line of scene) {
            for (const ch of line) {
              el.textContent += ch;
              await sleep(18);
            }
            el.textContent += '\n';
            await sleep(140);
          }
          await sleep(2600);
        }
      }
    })();
  },

  // Help modal
  openHelp() {
    const modal = document.getElementById('help-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    UI.setHelpTab('info');
    const helpVersion = document.getElementById('help-version');
    if (helpVersion) helpVersion.textContent = `v${CONFIG.version} ${CONFIG.versionLabel}`;
  },
  
  closeHelp() {
    const modal = document.getElementById('help-modal');
    if (!modal) return;
    modal.style.display = 'none';
  },
  
  /** @param {string} tab */
  setHelpTab(tab) {
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
    const tabBtn = document.querySelector(`.modal-tab[data-tab="${tab}"]`);
    if (tabBtn) tabBtn.classList.add('active');
    const tabContent = document.getElementById(`help-${tab}`);
    if (tabContent) tabContent.classList.add('active');
  },
  
  // Show floating stat change
  /** @param {string} stat @param {number} value */
  showStatFloat(stat, value) {
    const statEl = document.querySelector(`[data-stat="${stat}"]`);
    if (!statEl) return;
    
    const float = document.createElement('div');
    float.className = `stat-float ${value > 0 ? 'positive' : 'negative'}`;
    float.textContent = `${value > 0 ? '+' : ''}${value} ${stat}`;
    
    const rect = statEl.getBoundingClientRect();
    float.style.left = `${rect.left}px`;
    float.style.top = `${rect.top}px`;
    
    document.body.appendChild(float);
    setTimeout(() => float.remove(), 1500);
  },
  
  // Render a single consumable/selectable item
  /** @param {Consumable} item @param {Record<string, string | number>} [datasetAttrs] */
  renderConsumableItem(item, datasetAttrs) {
    const element = document.createElement('div');
    element.className = 'consumable-select-item';
    
    // Add custom dataset attributes
    if (datasetAttrs) {
      Object.entries(datasetAttrs).forEach(([key, value]) => {
        element.dataset[key] = String(value);
      });
    }
    
    const statInfo = UI.formatConsumableStat(item);
    
    element.innerHTML = `
      <span class="cs-emoji">${item.emoji}</span>
      <div class="cs-details">
        <div class="cs-name">${item.name}</div>
        <div class="cs-effect">${statInfo}</div>
        <div class="cs-desc">${item.desc}</div>
        <div class="cs-rarity ${item.rarity}">${item.rarity}</div>
      </div>
    `;
    
    return element;
  },
  
  // Format stat info for consumable display
  /** @param {Consumable} item @returns {string} */
  formatConsumableStat(item) {
    if (item.multiplier) {
      return `<span class="cs-multiplier" style="color: var(--accent-yellow)">${item.multiplier > 1 ? item.multiplier + '× stat' : Math.abs(item.multiplier) * 100 + '% stat'}</span>`;
    }
    if (item.stat === 'any') {
      return `<span class="cs-stat-any" style="color: var(--accent-green)">+${item.bonus} to ANY stat</span>`;
    }
    const statName = STAT_META[/** @type {StatKey} */ (item.stat)]?.name || item.stat;
    return `<span class="cs-stat" style="color: ${STAT_META[/** @type {StatKey} */ (item.stat)]?.color || '#fff'}">+${item.bonus} ${statName}</span>`;
  },
  /** @type {(() => void) | null} */
  _presetToggleHandler: null,
  /** @type {((e: Event) => void) | null} */
  _presetCloseHandler: null,
  /** @type {Archetype | null} */
  _selectedPreset: null,
  
  // Show a screen
  /** @param {string} screenId */
  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(`screen-${screenId}`);
    if (screen) {
      screen.classList.add('active');
      UI.currentScreen = screenId;
    }
  },
  
  
  // Render active perks as chips
  renderPerks() {
    const container = document.getElementById('perk-list');
    if (!container) return;
    
    container.innerHTML = '';
    if (PerkSystem.active.length === 0) {
      container.innerHTML = '<span class="empty-text">Max a stat to 10 to unlock perks</span>';
      return;
    }
    
    PerkSystem.active.forEach(id => {
      const perk = PERK_BY_ID[id];
      const chip = document.createElement('span');
      chip.className = 'perk-chip';
      chip.dataset.perkId = id;
      chip.dataset.desc = perk.desc;
      chip.innerHTML = `${perk.emoji} ${perk.name}`;
      
      // Mobile: tap to show tooltip
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        UI.showTooltip(perk);
      });
      
      container.appendChild(chip);
    });
  },
  
  // Render the seven SPECIAL stat bars into a container.
  // Shared by the side panel (renderSpecialStats) and the character popup
  // (renderPopupSpecial) so the bar markup has a single home.
  /** @param {HTMLElement} container */
  renderStatBars(container) {
    container.innerHTML = '';
    
    STAT_KEYS.forEach(key => {
      const meta = STAT_META[key];
      const effective = SpecialSystem.effective(key);
      const base = SpecialSystem.stats[key];
      const bonus = effective - base;
      
      const bar = document.createElement('div');
      bar.className = 'stat-bar';
      bar.innerHTML = `
        <span class="stat-letter" style="color: ${meta.color}">${key}</span>
        <div class="stat-track">
          <div class="stat-fill" style="width: ${effective * 10}%; background: ${meta.color}"></div>
        </div>
        <span class="stat-num" style="color: ${meta.color}">${base}${bonus > 0 ? `(+${bonus})` : ''}</span>
      `;
      container.appendChild(bar);
    });
  },
  
  // Render SPECIAL stats in game
  renderSpecialStats() {
    const container = document.getElementById('special-stats');
    if (container) UI.renderStatBars(container);
    UI.renderPerks();
  },
  
  // Render equipment
  renderEquipment() {
    const container = document.getElementById('equipment-list');
    const state = Game.state;
    if (!container || !state) return;
    const equipment = state.equipment;
    
    if (equipment.length === 0) {
      container.innerHTML = '<span class="empty-text">No equipment yet</span>';
      return;
    }
    
    container.innerHTML = '';
    equipment.forEach(item => {
      const effectText = equipmentEffectText(item);
      const el = document.createElement('span');
      el.className = 'equip-item';
      el.dataset.tooltip = `${item.name}: ${effectText}`;
      el.innerHTML = `${item.emoji}`;
      
      // Mobile: tap to show full tooltip
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        UI.showTooltip(item);
      });
      
      container.appendChild(el);
    });
  },
  
  // Render career log
  renderCareerLog() {
    const container = document.getElementById('career-log');
    const state = Game.state;
    if (!container || !state) return;
    const log = state.careerLog.slice(0, CONFIG.game.careerLog.sidePanel);
    
    container.innerHTML = '';
    log.forEach((entry, i) => {
      const el = document.createElement('div');
      el.className = `log-entry ${i === 0 ? 'recent' : ''}`;
      const careerYear = dayToCareerYear(entry.day);
      el.textContent = `Year ${careerYear}: ${entry.message}`;
      container.appendChild(el);
    });
    
    // Also update recent activity in main game area
    UI.renderRecentActivity();
  },
  
  // Render recent activity (mobile-friendly)
  renderRecentActivity() {
    const container = document.getElementById('recent-log-entries');
    const state = Game.state;
    if (!container || !state) return;
    
    const recentEntries = state.careerLog.slice(0, CONFIG.game.careerLog.recent);
    
    container.innerHTML = '';
    recentEntries.forEach((entry, i) => {
      const el = document.createElement('div');
      el.className = `recent-log-entry ${i === 0 ? 'recent' : ''}`;
      const careerYear = dayToCareerYear(entry.day);
      el.textContent = `Year ${careerYear}: ${entry.message}`;
      container.appendChild(el);
    });
  },
  
  // Render top bar
  renderTopBar() {
    const state = Game.state;
    if (!state) return;
    const phaseEl = document.getElementById('career-phase');
    if (phaseEl) phaseEl.textContent = CONFIG.game.phaseNames[state.phase];
    // Career spans ~8-10 years across ~24 events, each event ~0.4 years
    const careerYear = dayToCareerYear(state.day);
    const dayEl = document.getElementById('career-day');
    if (dayEl) dayEl.textContent = `Year ${careerYear}`;
    const levelEl = document.getElementById('player-level');
    if (levelEl) levelEl.textContent = String(state.level);
    
    // Progress toward next boss (🚀 Fast Ship: 5 instead of 6)
    const progressText = UI.progressText();
    const progressEl = document.getElementById('level-progress');
    if (progressEl) progressEl.textContent = progressText;
    const progressTopEl = document.getElementById('level-progress-top');
    if (progressTopEl) progressTopEl.textContent = `Level ${state.level} · ${progressText}`;
  },
  
  // Progress text toward next boss (or level-up indicator)
  progressText() {
    const state = Game.state;
    if (!state) return '';
    const bossEvery = PerkSystem.bossInterval();
    const eventsInCycle = state.eventsCompleted % bossEvery;
    return state.levelUpPoints > 0 ? 'LEVEL UP!' : `${eventsInCycle}/${bossEvery}`;
  },
  
  // Render an event
  /** @param {GameEvent} event */
  renderEvent(event) {
    const container = document.getElementById('event-container');
    const state = Game.state;
    if (!container || !state) return;
    const letters = ['A', 'B', 'C', 'D'];
    
    const card = document.createElement('div');
    card.className = 'event-card';
    card.id = 'event-card';
    
    // Build consumable buttons if player has any
    let consumableHTML = '';
    if (state.consumables.length > 0) {
      const grouped = /** @type {Record<string, Consumable & { count: number }> } */ ({});
      state.consumables.forEach(c => {
        if (!grouped[c.id]) grouped[c.id] = { ...c, count: 0 };
        grouped[c.id].count++;
      });
      
      consumableHTML = `
        <div class="consumable-bar">
          <span class="consumable-label">🧪 Consumables:</span>
          <div class="consumable-buttons">
            ${Object.values(grouped).map(c => `
              <button class="cons-btn" data-id="${c.id}">
                <span class="cons-info" data-id="${c.id}">?</span>
                ${c.emoji} ${c.name} ×${c.count}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    // Low-stat warning for mobile, where the SPECIAL bar is a hidden drawer:
    // any stat at or below the danger threshold is one hit from a saving roll.
    // Hidden on desktop (≥900px) where the bar is always visible (CSS).
    const danger = Game.dangerStats();
    const dangerHTML = danger.length > 0
      ? `<div class="stat-danger-strip">⚠️ Danger: ${danger.map(k => STAT_META[k].name).join(', ')}</div>`
      : '';
    
    card.innerHTML = `
      <div class="event-header">
        <div class="event-phase">${event.phaseLabel}</div>
        <div class="event-title">${event.title}</div>
      </div>
      ${dangerHTML}
      <div class="event-body">
        <div class="event-narrative">${event.narrative}</div>
        ${consumableHTML}
        <div class="event-choices">
          ${event.choices.map((choice, i) => {
            const checks = Object.entries(choice.checks || {});
            const checkHTML = checks.length > 0
              ? `<div class="choice-checks">${checks.map(([stat, target]) => {
                  // Simple preview: effective stat (includes equipment and
                  // consumable bonuses) vs the full target. Below target =
                  // red (a good roll is your only hope), at/above = green.
                  // Luck stays a hidden factor — it is not shown in the
                  // preview.
                  const currentStat = SpecialSystem.effective(/** @type {StatKey} */ (stat));
                  const success = currentStat >= /** @type {number} */ (target);
                  return `<span class="check ${success ? 'success' : 'fail'}">${STAT_META[/** @type {StatKey} */ (stat)].name}: ${target} ${success ? '✓' : '✗'}</span>`;
                }).join('')}</div>`
              : '';
            return `
              <button class="choice-btn" data-choice="${i}">
                <span class="choice-letter">${letters[i]}.</span> ${choice.text}
                ${checkHTML}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
    
    container.innerHTML = '';
    container.appendChild(card);
    
    // Bind consumable buttons
    /** @type {NodeListOf<HTMLElement>} */ (card.querySelectorAll('.cons-btn')).forEach(/** @param {HTMLElement} btn */ (btn) => {
      const infoBtn = /** @type {HTMLElement | null} */ (btn.querySelector('.cons-info'));
      if (infoBtn) {
        // Desktop: hover to show
        infoBtn.addEventListener('mouseenter', () => {
          const id = infoBtn.dataset.id;
          const consumable = CONSUMABLES.find(c => c.id === id);
          if (consumable) UI.showTooltip(consumable);
        });
        infoBtn.addEventListener('mouseleave', () => {
          UI.hideTooltip();
        });
        // Mobile: tap to show (stays until tapped elsewhere)
        infoBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = /** @type {HTMLElement} */ (e.target).dataset.id;
          const consumable = CONSUMABLES.find(c => c.id === id);
          if (consumable) {
            UI.showTooltip(consumable);
          }
        });
      }
      btn.addEventListener('click', (e) => {
        if (!(/** @type {Element} */ (e.target)).classList.contains('cons-info')) {
          const id = btn.dataset.id;
          if (id) UI.useConsumable(id, event);
        }
      });
    });
    
    // Bind choice buttons
    /** @type {NodeListOf<HTMLElement>} */ (card.querySelectorAll('.choice-btn')).forEach(/** @param {HTMLElement} btn */ (btn) => {
      btn.addEventListener('click', () => {
        UI.playSound('click');
        const choiceIndex = parseInt(btn.dataset.choice || '0', 10);
        UI.handleChoice(event, choiceIndex);
      });
    });
  },
  
  // Use a consumable before a choice
  /** @param {string} id @param {GameEvent} event */
  useConsumable(id, event) {
    const result = ConsumableManager.use(id);
    if (!result) return;
    
    // Handle multiplier (AI) consumables
    if (result.multiplier !== undefined) {
      SpecialSystem.applyMultiplier(result.multiplier);
      UI.renderSpecialStats();
      
      // Build the feedback banner now, insert it AFTER the re-render —
      // renderEvent replaces the card DOM and would wipe an earlier insert
      const feedback = document.createElement('div');
      feedback.className = 'consumable-feedback';
      
      if (result.backfired) {
        feedback.style.borderColor = 'var(--accent-red)';
        feedback.style.color = 'var(--accent-red)';
        feedback.style.background = 'rgba(255, 82, 82, 0.1)';
        feedback.innerHTML = `${result.emoji} ${result.name} backfired! AI made it worse...`; 
      } else {
        feedback.innerHTML = `${result.emoji} ${result.name} activated! ${result.effective} — let's hope it works...`;
      }
      
      UI.renderEvent(event);
      UI.insertConsumableFeedback(feedback, 3000);
      return;
    }
    
    // Handle normal bonus consumables
    if (result.stat === 'any') {
      STAT_KEYS.forEach(s => SpecialSystem.applyTempBonus(s, result.bonus));
    } else {
      SpecialSystem.applyTempBonus(result.stat, result.bonus);
    }
    
    UI.renderSpecialStats();
    
    // Show feedback (inserted after the re-render — see insertConsumableFeedback)
    const feedback = document.createElement('div');
    feedback.className = 'consumable-feedback';
    const statName = result.stat === 'any' ? 'All Stats' : (STAT_META[result.stat]?.name || result.stat);
    feedback.innerHTML = `${result.emoji} ${result.name} used! +${result.bonus} ${statName}`;
    
    UI.renderEvent(event);
    UI.insertConsumableFeedback(feedback, 2000);
  },
  
  // Insert a transient consumable feedback banner into the freshly
  // re-rendered event card. Must run AFTER renderEvent, which replaces the
  // card DOM. Auto-removes after `duration` ms.
  /** @param {HTMLElement} feedback @param {number} duration */
  insertConsumableFeedback(feedback, duration) {
    const body = /** @type {HTMLElement | null} */ (document.querySelector('#event-card .event-body'));
    if (!body) {
      feedback.remove();
      return;
    }
    const consumableBar = body.querySelector('.consumable-bar');
    if (consumableBar) {
      consumableBar.insertAdjacentElement('afterend', feedback);
    } else {
      body.prepend(feedback);
    }
    setTimeout(() => feedback.remove(), duration);
  },
  
  // Handle a choice selection: resolve the checks, let the player decide
  // on any available perk interventions, then apply and show the outcome.
  /** @param {GameEvent} event @param {number} choiceIndex */
  handleChoice(event, choiceIndex) {
    const resolved = Game.resolveChoice(event, choiceIndex);
    if ('error' in resolved) {
      console.error(resolved.error);
      return;
    }
    
    const available = Object.keys(resolved.interventions)
      .filter(k => resolved.interventions[/** @type {keyof PerkInterventions} */ (k)]);
    
    // No interventions available — apply immediately (the common case)
    if (available.length === 0) {
      UI.showOutcome(Game.applyChoice(resolved));
      return;
    }
    
    // Interventions available — pending screen; nothing is applied until
    // the player has decided on every prompt
    /** @type {Record<string, boolean | null>} */ const decisions = {};
    available.forEach(k => { decisions[k] = null; });
    UI.renderPerkDecision(resolved, decisions, available);
  },
  
  // Pending result screen: the checks are resolved but NOTHING is applied
  // yet. The player decides on each available perk intervention; once all
  // are decided, the outcome is applied (showOutcome). Re-renders after
  // each decision, so decided prompts drop away.
  /** @param {ResolvedChoice} resolved @param {Record<string, boolean | null>} decisions @param {string[]} available */
  renderPerkDecision(resolved, decisions, available) {
    const card = document.getElementById('event-card');
    const body = card ? card.querySelector('.event-body') : null;
    if (!body) return;
    
    const choices = /** @type {HTMLElement | null} */ (body.querySelector('.event-choices'));
    if (choices) choices.style.display = 'none';
    const existingResult = body.querySelector('.event-result');
    if (existingResult) existingResult.remove();
    
    const resultDiv = document.createElement('div');
    resultDiv.className = 'event-result';
    
    const pending = available.filter(k => decisions[k] === null);
    const decided = available.filter(k => decisions[k] !== null);
    
    let html = `<div class="result-text failure">⚡ The check failed — you can intervene:</div>`;
    
    // The rolled checks, so the player can weigh the intervention
    if (resolved.checkResults.length > 0) {
      const checkHTML = resolved.checkResults.map(cr =>
        `<span class="stat-change ${cr.success ? 'positive' : 'negative'}">${cr.stat}: rolled ${cr.roll} vs ${cr.target} ${cr.success ? '✓' : '✗'}</span>`
      ).join('');
      html += `<div class="stat-changes">${checkHTML}</div>`;
    }
    
    // Decided prompts (dimmed, in decision order)
    for (const k of decided) {
      const meta = INTERVENTION_META[/** @type {keyof typeof INTERVENTION_META} */ (k)];
      const perk = PERK_BY_ID[meta.perkId];
      html += `<div class="perk-prompt-box decided">${perk.emoji} <strong>${perk.name}</strong> — ${decisions[k] ? 'used' : 'declined'}</div>`;
    }
    
    // Pending prompts
    for (const k of pending) {
      const meta = INTERVENTION_META[/** @type {keyof typeof INTERVENTION_META} */ (k)];
      html += perkPromptBox(meta.perkId, `btn-intervene-yes-${k}`, `btn-intervene-no-${k}`, meta.label);
    }
    
    resultDiv.innerHTML = html;
    body.appendChild(resultDiv);
    
    /** @param {string} k @param {boolean} used */
    const decide = (k, used) => {
      decisions[k] = used;
      if (available.every(key => decisions[key] !== null)) {
        /** @type {PerkDecisions} */ const use = { negotiate: false, bruteForce: false, codeReview: false };
        for (const key of available) use[/** @type {keyof PerkDecisions} */ (key)] = !!decisions[key];
        UI.showOutcome(Game.applyChoice(resolved, use));
      } else {
        UI.renderPerkDecision(resolved, decisions, available);
      }
    };
    
    for (const k of pending) {
      const yes = document.getElementById(`btn-intervene-yes-${k}`);
      const no = document.getElementById(`btn-intervene-no-${k}`);
      if (yes) yes.addEventListener('click', () => decide(k, true));
      if (no) no.addEventListener('click', () => decide(k, false));
    }
  },
  
  // Show an applied outcome: refresh panels, float the stat changes, toast
  // the milestones, render the result screen.
  /** @param {ProcessResult} result */
  showOutcome(result) {
    const state = Game.state;
    if (!state) return;
    
    // Update UI elements
    UI.renderSpecialStats();
    UI.renderEquipment();
    UI.renderCareerLog();
    UI.renderTopBar();
    
    // Show floating stat changes
    for (const [stat, value] of Object.entries(result.effects || {})) {
      if (value !== 0) {
        UI.showStatFloat(stat, value);
      }
    }
    
    // Show toast notifications and play sounds for milestones.
    // Terminal states first: a run can END on a boss event (bossDefeated
    // is title-derived, gameOver is computed independently), and the level
    // cadence can fire on the same event — celebration toasts must not
    // clobber the death/retirement ones. Mirrors the continue-button chain.
    if (result.gameOver) {
      UI.showToast('💀 Career Over', 'error');
      UI.playSound('gameover');
      UI.flashScreen('rgba(255, 0, 0, 0.4)');
    } else if (result.victory) {
      UI.showToast('🏆 Retirement!', 'success');
      UI.playSound('victory');
      UI.flashScreen('rgba(255, 215, 0, 0.3)');
    } else if (result.leveledUp) {
      UI.showToast(`📈 Level Up! Now level ${state.level}`, 'success');
      UI.playSound('levelup');
    } else if (result.bossDefeated) {
      UI.showToast('🏆 Boss Defeated!', 'success');
      UI.playSound('boss');
      UI.flashScreen('rgba(0, 255, 136, 0.3)');
    } else if (result.itemDropped) {
      UI.showToast(`🎁 Found: ${result.itemDropped.emoji} ${result.itemDropped.name}`, 'success');
      UI.playSound('success');
    } else {
      // Regular choice sound
      UI.playSound(result.success ? 'success' : 'failure');
    }
    
    UI.renderResult(result);
  },
  
  // Render the event result screen. Called from showOutcome once the
  // outcome has been fully applied (interventions decided).
  /** @param {ProcessResult} result */
  renderResult(result) {
    const card = document.getElementById('event-card');
    const body = card ? card.querySelector('.event-body') : null;
    const state = Game.state;
    if (!body || !state) return;
    
    const choices = /** @type {HTMLElement | null} */ (body.querySelector('.event-choices'));
    if (choices) choices.style.display = 'none';
    
    // Re-renders (after perk prompts) replace the previous result
    const existingResult = body.querySelector('.event-result');
    if (existingResult) existingResult.remove();
    
    // 🍀 Clean Deploy intervened (auto-reroll) — announce it; the result
    // below already shows the rerolled outcome
    if (result.cleanDeployUsed) {
      result.cleanDeployUsed = false;
      UI.showToast(`⚡ Clean Deploy: ${result.success ? 'SUCCESS' : 'FAILURE'}`, result.success ? 'success' : 'error');
      UI.playSound('perk');
    }
    
    // 🧘 Iron Nerves saved the run from a burnout floor — announce it;
    // the stat changes below already show E landing at 3
    if (result.ironNervesUsed) {
      result.ironNervesUsed = false;
      UI.showToast('🧘 Iron Nerves: you pushed through the collapse', 'success');
      UI.playSound('perk');
    }
    
    const resultDiv = document.createElement('div');
    resultDiv.className = 'event-result';
    
    let resultHTML = `<div class="result-text ${result.success ? 'success' : 'failure'}">${result.log}</div>`;
    
    // Show stat changes
    const statChanges = [];
    for (const [stat, value] of Object.entries(result.effects || {})) {
      if (value !== 0) {
        statChanges.push(`<span class="stat-change ${value > 0 ? 'positive' : 'negative'}">${STAT_META[/** @type {StatKey} */ (stat)].name}: ${value > 0 ? '+' : ''}${value}</span>`);
      }
    }
    if (statChanges.length > 0) {
      resultHTML += `<div class="stat-changes">${statChanges.join('')}</div>`;
    }
    
    // Show item drop
    let showEquipmentChoice = false;
    if (result.equipmentDropped) {
      // Inventory full — the item is held in pendingEquipmentDrop; show choice screen
      const pending = state.pendingEquipmentDrop;
      if (!pending) return;
      resultHTML += `<div class="item-drop">🎁 Found: ${pending.emoji} ${pending.name} — inventory full!</div>`;
      showEquipmentChoice = true;
    } else if (result.itemDropped) {
      // Item already added to inventory by Game.checkForEquipmentDrop()
      resultHTML += `<div class="item-drop">🎁 Found: ${result.itemDropped.emoji} ${result.itemDropped.name}</div>`;
      UI.renderEquipment();
    }
    
    // Show check results
    if (result.checkResults && result.checkResults.length > 0) {
      const checkHTML = result.checkResults.map(cr => 
        `<span class="stat-change ${cr.success ? 'positive' : 'negative'}">${cr.stat}: rolled ${cr.roll} vs ${cr.target} ${cr.success ? (cr.negotiated ? '🤝' : '✓') : '✗'}</span>`
      ).join('');
      resultHTML += `<div class="stat-changes">${checkHTML}</div>`;
    }
    
    // Continue button
    let continueText = 'Continue →';
    if (result.gameOver) continueText = 'View Results →';
    else if (result.victory) continueText = 'View Retirement →';
    else if (result.leveledUp) continueText = 'Level Up →';
    else if (result.phaseComplete) continueText = 'Continue →';
    else if (result.bossDefeated) continueText = 'Boss Defeated — Continue →';
    
    resultHTML += `<div class="result-actions"><button class="btn btn-primary btn-continue" id="btn-continue-event">${continueText}</button></div>`;
    
    resultDiv.innerHTML = resultHTML;
    body.appendChild(resultDiv);
    
    // Bind continue button
    const continueBtn = document.getElementById('btn-continue-event');
    if (continueBtn) continueBtn.addEventListener('click', () => {
      if (showEquipmentChoice) {
        const pending = state.pendingEquipmentDrop;
        if (pending) UI.showEquipmentChoice(pending, [...state.equipment]);
      } else if (result.gameOver) {
        UI.showGameOver(result.gameOver.reason);
      } else if (result.victory) {
        UI.showVictory();
      } else if (result.leveledUp) {
        UI.showLevelUpStats();
      } else {
        // Plain continue, or phase complete: nextEvent() owns phase
        // advancement (bossCompleted → advancePhase → recurse)
        UI.nextEvent();
      }
    });
  },
  
  // Get next event
  nextEvent() {
    if (!Game.state) {
      console.error('[DevLife] Game.state is null');
      const container = document.getElementById('event-container');
      if (container) container.innerHTML = '<div class="event-card"><div class="event-body"><p style="color: var(--accent-red)">Error: Game state not initialized</p></div></div>';
      return;
    }
    
    // Event picking and phase advancement live in Game.nextEvent; the UI
    // only renders. If the pick advanced a phase, refresh the top bar and
    // career log so the promotion entry shows before the next event.
    const phaseBefore = Game.state.phase;
    const event = Game.nextEvent();
    if (Game.state.phase !== phaseBefore) {
      UI.renderTopBar();
      UI.renderCareerLog();
    }
    UI.renderEvent(event);
  },
  
  // --- Popup Panel Methods ---
  
  /** @param {string} panelName */
  openPopup(panelName) {
    // Close any currently open popup
    UI.closePopup();
    
    const panel = document.getElementById(`panel-${panelName}`);
    if (!panel) return;
    
    // Render content based on panel type
    switch (panelName) {
      case 'special':
        UI.renderPopupSpecial();
        break;
      case 'equipment':
        UI.renderPopupEquipment();
        break;
      case 'log':
        UI.renderPopupCareerLog();
        break;
      case 'save':
        // Save popup — no extra rendering needed
        break;
    }
    
    panel.classList.add('active');
  },
  
  closePopup() {
    document.querySelectorAll('.popup-panel').forEach(p => p.classList.remove('active'));
  },
  
  renderPopupSpecial() {
    const state = Game.state;
    if (!state) return;
    const bars = document.getElementById('popup-special-stats');
    if (bars) UI.renderStatBars(bars);
    
    setText('popup-player-level', String(state.level));
    setText('popup-level-progress', UI.progressText());
  },
  
  renderPopupEquipment() {
    const container = document.getElementById('popup-equipment-list');
    const state = Game.state;
    if (!container || !state) return;
    const equipment = state.equipment;
    
    if (equipment.length === 0) {
      container.innerHTML = '<span class="empty-text">No equipment yet</span>';
      return;
    }
    
    container.innerHTML = '';
    
    // Show equipment count
    const countEl = document.createElement('div');
    countEl.style.cssText = 'font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); margin-bottom: var(--spacing-md); text-transform: uppercase; letter-spacing: 1px;';
    countEl.textContent = `${equipment.length} item${equipment.length > 1 ? 's' : ''} equipped`;
    container.appendChild(countEl);
    
    equipment.forEach(item => {
      const el = document.createElement('div');
      el.className = 'equip-popup-item';
      
      const rarityColor = {
        common: 'var(--accent-yellow)',
        uncommon: 'var(--accent-purple)',
        rare: 'var(--accent-red)',
        epic: 'var(--accent-cyan)'
      }[item.rarity] || 'var(--text-muted)';
      
      const effectsHTML = Object.entries(item.effects)
        .map(([k, v]) => `+${v} ${STAT_META[/** @type {StatKey} */ (k)]?.name || k}`)
        .join(', ');
      
      el.innerHTML = `
        <div class="equip-popup-emoji">${item.emoji}</div>
        <div class="equip-popup-info">
          <div class="equip-popup-name">${item.name}</div>
          <span class="equip-popup-rarity" style="color: ${rarityColor}">${item.rarity}</span>
          <div class="equip-popup-effects">${effectsHTML}</div>
          <div class="equip-popup-desc">${item.desc}</div>
        </div>
      `;
      container.appendChild(el);
    });
  },
  
  renderPopupCareerLog() {
    const container = document.getElementById('popup-career-log');
    const state = Game.state;
    if (!container || !state) return;
    const log = state.careerLog.slice(0, CONFIG.game.careerLog.popup);
    
    container.innerHTML = '';
    log.forEach((entry, i) => {
      const el = document.createElement('div');
      el.className = `log-entry ${i === 0 ? 'recent' : ''}`;
      const careerYear = dayToCareerYear(entry.day);
      el.textContent = `Year ${careerYear}: ${entry.message}`;
      container.appendChild(el);
    });
  }
};

// Compose the full UI object from the section files (loaded before this one).
const UI = Object.assign({}, UICore, UICharacter, UILevelUp, UIEndOfRun);
