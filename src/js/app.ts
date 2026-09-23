// Main application entry point
const App = {
  init(): void {
    this.bindEvents();
    this.checkForSave();
    UI.initTooltipClose();
    UI.initPopupClose();
    UI.startAsciiLoop();
    this.initHelpTabs();
    UI.showScreen('title');
    UI.renderDifficultySelector();
    const versionText = `v${CONFIG.version} ${CONFIG.versionLabel}`;
    const versionBadge = document.getElementById('version-badge');
    if (versionBadge) versionBadge.textContent = versionText;
    const aboutVersion = document.getElementById('about-version');
    if (aboutVersion) aboutVersion.textContent = versionText;
  },

  bindEvents(): void {
    // Safely bind a click handler; skip (with a warning) if the element
    // is missing so one absent element can't break all later bindings.
    const bind = (id: string, handler: () => void): void => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', handler);
      } else {
        console.warn(`[d20().devLife] bindEvents: #${id} not found, skipping binding`);
      }
    };

    // Title screen
    bind('btn-new-game', () => this.startNewGame());
    bind('btn-continue', () => this.continueGame());

    // Character creation
    bind('btn-back-char', () => UI.showScreen('title'));
    bind('btn-start-career', () => this.startCareer());

    // Game screen - toolbar buttons
    document.querySelectorAll<HTMLElement>('.toolbar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const panelName = btn.dataset.panel;
        if (panelName) UI.openPopup(panelName);
      });
    });

    // Popup close buttons
    document.querySelectorAll('.popup-close').forEach(btn => {
      btn.addEventListener('click', () => UI.closePopup());
    });

    // Popup save confirm/cancel
    bind('btn-popup-save-confirm', () => {
      this.saveGame();
    });
    bind('btn-popup-save-cancel', () => {
      UI.closePopup();
    });

    // Popup reset confirm/cancel (issue #53)
    bind('btn-popup-reset-confirm', () => {
      UI.confirmResetStats();
    });
    bind('btn-popup-reset-cancel', () => {
      UI.closePopup();
    });

    // Hamburger menu toggle (mobile)
    bind('btn-menu-toggle-main', () => {
      const panel = document.getElementById('side-panel');
      const toggleBtn = document.getElementById('btn-menu-toggle-main');
      if (!panel || !toggleBtn) return;
      const isOpen = panel.classList.contains('open');
      UI.togglePanel(!isOpen);
      toggleBtn.classList.toggle('open');
    });
    bind('btn-menu-toggle', () => UI.togglePanel(true));
    bind('btn-close-panel', () => {
      UI.closePanel();
      const toggleBtn = document.getElementById('btn-menu-toggle-main');
      if (toggleBtn) toggleBtn.classList.remove('open');
    });
    bind('panel-overlay', () => {
      UI.closePanel();
      const toggleBtn = document.getElementById('btn-menu-toggle-main');
      if (toggleBtn) toggleBtn.classList.remove('open');
    });

    // Collapsible Info / About sections in the side panel
    const bindInfoToggle = (btnId: string, contentId: string, arrowId: string): void => {
      const btn = document.getElementById(btnId);
      const content = document.getElementById(contentId);
      const arrow = document.getElementById(arrowId);
      if (!btn || !content) return;
      btn.addEventListener('click', () => {
        const open = content.classList.toggle('open');
        if (arrow) arrow.textContent = open ? '▼' : '▶';
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    };
    bindInfoToggle('btn-toggle-info', 'info-content', 'info-arrow');
    bindInfoToggle('btn-toggle-about', 'about-content', 'about-arrow');

    bind('btn-save', () => UI.openPopup('save'));

    // Game over / Victory
    bind('btn-new-career', () => this.startNewGame());
    bind('btn-new-victory', () => this.startNewGame());

    // Help modal
    bind('btn-help-title', () => UI.openHelp());
    bind('btn-close-help', () => UI.closeHelp());

    // Achievements modal
    bind('btn-achievements-title', () => UI.showAchievements());
    bind('btn-close-achievements', () => UI.closeAchievements());

    // Options menu (issue #53)
    bind('btn-options-title', () => UI.showOptions());
    bind('btn-close-options', () => UI.closeOptions());
    bind('btn-options-statistics', () => { UI.closeOptions(); UI.showStatistics(); });
    bind('btn-options-reset', () => UI.resetStatsAndAchievements());

    // Statistics screen
    bind('btn-statistics-back', () => UI.closeStatistics());

    // End-of-run consumable selection (Stock Up) is bound inline by
    // UI.showConsumableSelection, which owns the shared pick-and-swap UI
  },

  checkForSave(): void {
    if (SaveSystem.hasSave()) {
      const btnContinue = document.getElementById('btn-continue');
      if (btnContinue) btnContinue.style.display = 'block';
    }
  },

  initHelpTabs(): void {
    document.querySelectorAll<HTMLElement>('.modal-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        if (tab.dataset.tab) UI.setHelpTab(tab.dataset.tab);
      });
    });
    // Close modal on overlay click
    const modal = document.getElementById('help-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) UI.closeHelp();
      });
    }
  },

  startNewGame(): void {
    // Reset SPECIAL system
    STAT_KEYS.forEach(key => {
      SpecialSystem.stats[key] = 1;
    });
    SpecialSystem.equipmentBonuses = zeroStats();

    UI.showScreen('character');
    UI.renderCharacterCreation();
  },

  startCareer(): void {
    // Starting a new career abandons any in-progress run — clear the save so
    // the old run can't be resurrected via a stale "Continue" (e.g. the player
    // hit New Career while a save existed, then allocated stats).
    SaveSystem.deleteSave();
    const btnContinue = document.getElementById('btn-continue');
    if (btnContinue) btnContinue.style.display = 'none';

    // The allocation screen's +/− buttons mutate SpecialSystem.stats
    // directly — the DOM rows are just a view, so read the state
    const stats = { ...SpecialSystem.stats };

    // Get starting consumables and equipment from meta
    const startingConsumables = MetaStore.carriedIds('startingConsumables').map(id => {
      return CONSUMABLES.find(c => c.id === id);
    }).filter((item): item is Consumable => Boolean(item));
    const startingEquipment = MetaStore.carriedIds('startingEquipment').map(id => {
      return EQUIPMENT.find(e => e.id === id);
    }).filter((item): item is Equipment => Boolean(item));

    // Initialize SPECIAL system (before createCharacter — init() zeros
    // equipmentBonuses, which createCharacter then fills from carry-over)
    SpecialSystem.init(stats);

    // Difficulty is chosen on the title screen and stored in meta (issue #6).
    const difficulty = MetaStore.selectedDifficulty();

    // Create game
    Game.createCharacter(stats, startingConsumables, startingEquipment, difficulty);

    // Initialize perk system (a starting build may already have a stat at 10)
    PerkSystem.reset();
    PerkSystem.refresh();

    // Show game screen
    UI.showScreen('game');
    UI.renderSpecialStats();
    UI.renderEquipment();
    UI.renderCareerLog();
    UI.renderTopBar();

    // Load first event
    UI.nextEvent();
  },

  continueGame(): void {
    const saveData = SaveSystem.load();
    if (!saveData) return;

    const state = Game.state;
    if (!state) return;

    // Re-sync perks with loaded stats
    PerkSystem.refresh();

    UI.showScreen('game');
    UI.renderSpecialStats();
    UI.renderEquipment();
    UI.renderCareerLog();
    UI.renderTopBar();

    // Resume an interrupted level-up instead of jumping to the next event:
    // unspent points go back to stat selection, a pending consumable pick
    // goes back to the pick screen (otherwise the points would be stranded
    // and progressText() would show "LEVEL UP!" forever)
    if ((state.levelUpPoints || 0) > 0) {
      UI.showLevelUpStats();
      return;
    }
    if (state.pendingLevelUpConsumables && state.pendingLevelUpConsumables.length > 0) {
      UI.showLevelUpConsumableSelection();
      return;
    }

    // Load last event or next event
    const lastEventId = state.currentEventId;
    if (lastEventId) {
      const event = EVENTS.find(e => e.id === lastEventId);
      if (event) {
        UI.renderEvent(event);
      } else {
        UI.nextEvent();
      }
    } else {
      UI.nextEvent();
    }
  },

  saveGame(): void {
    const state = Game.state;
    if (!state) return;
    SaveSystem.save(state);
    UI.closePopup();

    // Show brief feedback
    const btn = document.getElementById('btn-save');
    if (!btn) return;
    const original = btn.textContent;
    btn.textContent = '✓';
    setTimeout(() => {
      btn.textContent = original;
    }, 1000);
  },

  afterLevelUp(): void {
    // Apply level up
    const selected = document.querySelector<HTMLElement>('.levelup-stat.selected');
    if (selected) {
      const stat = selected.dataset.stat as StatKey;
      SpecialSystem.increase(stat);
    }

    const state = Game.state;
    if (!state) return;
    state.levelUpPoints = Math.max(0, (state.levelUpPoints || 1) - 1);

    // A stat increase may unlock a perk (e.g. pushing a stat to 10)
    Game.refreshPerks();
    UI.renderPerks();

    // 🧠 Rapid Learner: spend remaining points one at a time
    if (state.levelUpPoints > 0) {
      UI.showLevelUpStats();
      return;
    }

    UI.showScreen('game');
    UI.renderSpecialStats();
    UI.renderTopBar();
    UI.nextEvent();
  }
};

// Initialize when DOM is ready (and events are loaded)
document.addEventListener('DOMContentLoaded', async () => {
  await waitForEvents();
  App.init();
});
