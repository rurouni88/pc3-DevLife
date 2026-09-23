// Shared DOM helpers — the UI is static HTML, but the type system
// doesn't know that, so these narrow once and reuse.
const setDisplay = (id: string, display: string): void => {
  const el = document.getElementById(id);
  if (el) el.style.display = display;
};
const setText = (id: string, text: string): void => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

// Perk intervention prompts — one per available perk. Shared by the
// pending decision screen (renderPerkDecision).
const perkPromptBox = (perkId: string, yesId: string, noId: string, useLabel: string): string => {
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

// A perk prompt after the player has already decided — dimmed, no buttons.
const perkDecidedBox = (perkId: string, used: boolean): string => {
  const perk = PERK_BY_ID[perkId];
  return `<div class="perk-prompt-box decided">${perk.emoji} <strong>${perk.name}</strong> — ${used ? 'used' : 'declined'}</div>`;
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
  currentScreen: 'title' as string,

  // Difficulty selector (issue #6): lozenge row on the title screen.
  // The choice is stored in meta so it persists and is read by startCareer.
  renderDifficultySelector(): void {
    const container = document.getElementById('difficulty-selector');
    if (!container) return;
    const selected = MetaStore.selectedDifficulty();
    container.innerHTML = '';

    (Object.keys(CONFIG.game.difficulty) as Difficulty[]).forEach(key => {
      const cfg = CONFIG.game.difficulty[key];
      const lozenge = document.createElement('button');
      lozenge.className = 'difficulty-lozenge' + (key === selected ? ' selected' : '') + (cfg.locked ? ' locked' : '');
      lozenge.dataset.difficulty = key;
      lozenge.setAttribute('role', 'radio');
      lozenge.setAttribute('aria-checked', key === selected ? 'true' : 'false');
      lozenge.disabled = !!cfg.locked;
      lozenge.innerHTML = `<span class="difficulty-label">${cfg.label}</span>` +
        (cfg.locked ? '<span class="difficulty-lock">🔒</span>' : '<span class="cons-info difficulty-help" data-help="' + key + '" aria-label="About ' + cfg.label + '">?</span>');

      if (!cfg.locked) {
        lozenge.addEventListener('click', (e) => {
          // A tap on the "?" opens the tooltip; a tap elsewhere selects.
          if ((e.target as Element).closest('.difficulty-help')) return;
          UI.selectDifficulty(key);
        });
      }
      container.appendChild(lozenge);
    });

    // "?" info buttons: tap/click to show the tooltip — the same interaction
    // on mobile and desktop. Hover (mouseenter/mouseleave) fires unreliable
    // synthetic events on mobile, so it is intentionally not used here. The
    // global "click outside" handler (initTooltipClose) closes the tooltip.
    container.querySelectorAll<HTMLElement>('.difficulty-help').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.dataset.help as Difficulty;
        const cfg = CONFIG.game.difficulty[key];
        if (cfg) UI.showTooltip({ emoji: cfg.emoji, name: cfg.label, desc: cfg.desc });
      });
    });
  },

  // Persist the chosen difficulty and re-render the selector.
  selectDifficulty(key: Difficulty): void {
    const cfg = CONFIG.game.difficulty[key];
    if (!cfg || cfg.locked) return;
    MetaStore.setSelectedDifficulty(key);
    UI.playSound('click');
    UI.renderDifficultySelector();
  },

  // Audio context for sound effects
  audioCtx: null as AudioContext | null,

  // Initialize audio (must be called after user interaction)
  initAudio(): void {
    if (UI.audioCtx) return;
    UI.audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  },

  // Play a sound effect
  playSound(type: string): void {
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
  flashScreen(color: string, duration: number = 300): void {
    const flash = document.createElement('div');
    flash.className = 'screen-flash';
    flash.style.backgroundColor = color;
    document.body.appendChild(flash);

    setTimeout(() => flash.remove(), duration);
  },

  // Show toast notification
  showToast(message: string, type: string = 'success'): void {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  },

  // Wire up the click-to-close behaviour for the character modal. (The "?"
  // tooltip's close handling lives in UITooltip.initTooltipClose.)
  initPopupClose(): void {
    document.addEventListener('click', (e) => {
      if ((e.target as Element).classList.contains('popup-close')) {
        UI.closePopup();
      }
      const activePopup = document.querySelector('.popup-panel.active');
      if (activePopup && e.target === activePopup) {
        UI.closePopup();
      }
    });
  },

  // Satirical ASCII loop on the title screen (pauses while hidden)
  startAsciiLoop(): void {
    const el = document.getElementById('ascii-terminal-body');
    if (!el) return;
    const scenes = [
      ['$ deploy --friday', 'building... done', 'tests... skipped', 'prod: ON FIRE', 'you: "it\'s a feature"'],
      ['lead: blockers?', 'you: none!', '(47 tabs, 1 coffee)', 'lead: great energy', 'you: ██████░░░░ 60%'],
      ['Junior ──────> Staff', 'promotion: pending', 'budget: -30%', 'you: still here??', '...legend.']
    ];
    const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
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
  openHelp(): void {
    const modal = document.getElementById('help-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    UI.setHelpTab('info');
    const helpVersion = document.getElementById('help-version');
    if (helpVersion) helpVersion.textContent = `v${CONFIG.version} ${CONFIG.versionLabel}`;
  },

  closeHelp(): void {
    const modal = document.getElementById('help-modal');
    if (!modal) return;
    modal.style.display = 'none';
  },

  setHelpTab(tab: string): void {
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
    const tabBtn = document.querySelector(`.modal-tab[data-tab="${tab}"]`);
    if (tabBtn) tabBtn.classList.add('active');
    const tabContent = document.getElementById(`help-${tab}`);
    if (tabContent) tabContent.classList.add('active');
  },

  // Show floating stat change
  showStatFloat(stat: string, value: number): void {
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
  renderConsumableItem(item: Consumable, datasetAttrs?: Record<string, string | number>): HTMLElement {
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
  formatConsumableStat(item: Consumable): string {
    if (item.multiplier) {
      return `<span class="cs-multiplier" style="color: var(--accent-yellow)">${item.multiplier > 1 ? item.multiplier + '× stat' : Math.abs(item.multiplier) * 100 + '% stat'}</span>`;
    }
    if (item.stat === 'any') {
      return `<span class="cs-stat-any" style="color: var(--accent-green)">+${item.bonus} to ANY stat</span>`;
    }
    const statName = STAT_META[item.stat as StatKey]?.name || item.stat;
    return `<span class="cs-stat" style="color: ${STAT_META[item.stat as StatKey]?.color || '#fff'}">+${item.bonus} ${statName}</span>`;
  },

  // Show a screen
  showScreen(screenId: string): void {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(`screen-${screenId}`);
    if (screen) {
      screen.classList.add('active');
      UI.currentScreen = screenId;
    }
  },


  // Render active perks as chips
  renderPerks(): void {
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
      chip.innerHTML = `${perk.emoji} ${perk.name}<span class="cons-info" aria-label="About ${perk.name}">?</span>`;

      // Tap/click the "?" to show the tooltip (same as consumables/difficulty).
      chip.querySelector<HTMLElement>('.cons-info')!.addEventListener('click', (e) => {
        e.stopPropagation();
        UI.showTooltip(perk);
      });

      container.appendChild(chip);
    });
  },

  // Render the seven SPECIAL stat bars into a container.
  // Shared by the side panel (renderSpecialStats) and the character popup
  // (renderPopupSpecial) so the bar markup has a single home.
  renderStatBars(container: HTMLElement): void {
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
  renderSpecialStats(): void {
    const container = document.getElementById('special-stats');
    if (container) UI.renderStatBars(container);
    UI.renderPerks();
  },

  // Render equipment
  renderEquipment(): void {
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
      const el = document.createElement('span');
      el.className = 'equip-item';
      el.innerHTML = `${item.emoji}<span class="cons-info" aria-label="About ${item.name}">?</span>`;

      // Tap/click the "?" to show the tooltip (same as consumables/difficulty).
      el.querySelector<HTMLElement>('.cons-info')!.addEventListener('click', (e) => {
        e.stopPropagation();
        UI.showTooltip(item);
      });

      container.appendChild(el);
    });
  },

  // Render career log
  renderCareerLog(): void {
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
  renderRecentActivity(): void {
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
  renderTopBar(): void {
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
  progressText(): string {
    const state = Game.state;
    if (!state) return '';
    const bossEvery = PerkSystem.bossInterval();
    const eventsInCycle = state.eventsCompleted % bossEvery;
    return state.levelUpPoints > 0 ? 'LEVEL UP!' : `${eventsInCycle}/${bossEvery}`;
  },

  // --- Popup Panel Methods ---

  openPopup(panelName: string): void {
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

  closePopup(): void {
    document.querySelectorAll('.popup-panel').forEach(p => p.classList.remove('active'));
  },

  renderPopupSpecial(): void {
    const state = Game.state;
    if (!state) return;
    const bars = document.getElementById('popup-special-stats');
    if (bars) UI.renderStatBars(bars);

    setText('popup-player-level', String(state.level));
    setText('popup-level-progress', UI.progressText());
  },

  renderPopupEquipment(): void {
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
        .map(([k, v]) => `+${v} ${STAT_META[k as StatKey]?.name || k}`)
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

  renderPopupCareerLog(): void {
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
const UI = Object.assign({}, UICore, UICharacter, UILevelUp, UIEndOfRun, UIEventCard, UITooltip, UIAchievements);
