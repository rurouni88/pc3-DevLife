// Main application entry point
const App = {
  init() {
    this.bindEvents();
    this.checkForSave();
    UI.initTooltipClose();
    UI.startAsciiLoop();
    this.initHelpTabs();
    UI.showScreen('title');
    const versionText = `v${CONFIG.version} ${CONFIG.versionLabel}`;
    document.getElementById('version-badge').textContent = versionText;
    const aboutVersion = document.getElementById('about-version');
    if (aboutVersion) aboutVersion.textContent = versionText;
  },
  
  bindEvents() {
    // Safely bind a click handler; skip (with a warning) if the element
    // is missing so one absent element can't break all later bindings.
    /** @param {string} id @param {() => void} handler */
    const bind = (id, handler) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', handler);
      } else {
        console.warn(`[DevLife] bindEvents: #${id} not found, skipping binding`);
      }
    };
    
    // Title screen
    bind('btn-new-game', () => this.startNewGame());
    bind('btn-continue', () => this.continueGame());
    
    // Character creation
    bind('btn-back-char', () => UI.showScreen('title'));
    bind('btn-start-career', () => this.startCareer());
    
    // Game screen - toolbar buttons
    document.querySelectorAll('.toolbar-btn').forEach(/** @param {HTMLElement} btn */ (btn) => {
      btn.addEventListener('click', () => {
        const panelName = btn.dataset.panel;
        UI.openPopup(panelName);
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
    
    // Hamburger menu toggle (mobile)
    bind('btn-menu-toggle-main', () => {
      const panel = document.getElementById('side-panel');
      const toggleBtn = document.getElementById('btn-menu-toggle-main');
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
    /** @param {string} btnId @param {string} contentId @param {string} arrowId */
    const bindInfoToggle = (btnId, contentId, arrowId) => {
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
    
    // End-of-run consumable selection (Stock Up) is bound inline by
    // UI.showConsumableSelection, which owns the shared pick-and-swap UI
  },
  
  checkForSave() {
    if (SaveSystem.hasSave()) {
      document.getElementById('btn-continue').style.display = 'block';
    }
  },
  
  initHelpTabs() {
    document.querySelectorAll('.modal-tab').forEach(/** @param {HTMLElement} tab */ (tab) => {
      tab.addEventListener('click', () => {
        UI.setHelpTab(tab.dataset.tab);
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
  
  startNewGame() {
    // Reset SPECIAL system
    STAT_KEYS.forEach(key => {
      SpecialSystem.stats[key] = 1;
    });
    SpecialSystem.equipmentBonuses = { S: 0, P: 0, E: 0, C: 0, I: 0, A: 0, L: 0 };
    
    UI.showScreen('character');
    UI.renderCharacterCreation();
  },
  
  startCareer() {
    // Collect stats from character creation
    // All seven rows are present in the DOM; zeros are overwritten below
    /** @type {Stats} */ const stats = { S: 0, P: 0, E: 0, C: 0, I: 0, A: 0, L: 0 };
    const container = document.getElementById('stat-allocation');
    const rows = container.querySelectorAll('.stat-row');
    rows.forEach(row => {
      const label = row.querySelector('.stat-label').textContent;
      const valueEl = row.querySelector('.stat-value');
      // Row labels are the seven stat letters, in order
      stats[/** @type {StatKey} */ (label)] = parseInt(valueEl.textContent);
    });
    
    // Get starting consumables and equipment from meta
    const startingConsumables = MetaStore.carriedIds('startingConsumables').map(id => {
      return CONSUMABLES.find(c => c.id === id);
    }).filter(Boolean);
    const startingEquipment = MetaStore.carriedIds('startingEquipment').map(id => {
      return EQUIPMENT.find(e => e.id === id);
    }).filter(Boolean);
    
    // Initialize SPECIAL system (before createCharacter — init() zeros
    // equipmentBonuses, which createCharacter then fills from carry-over)
    SpecialSystem.init(stats);
    
    // Create game
    Game.createCharacter(stats, startingConsumables, startingEquipment);
    
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
  
  continueGame() {
    const saveData = SaveSystem.load();
    if (!saveData) return;
    
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
    if ((Game.state.levelUpPoints || 0) > 0) {
      UI.showLevelUpStats();
      return;
    }
    if (Game.state.pendingLevelUpConsumables && Game.state.pendingLevelUpConsumables.length > 0) {
      UI.showLevelUpConsumableSelection();
      return;
    }
    
    // Load last event or next event
    const lastEventId = Game.state.currentEventId;
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
  
  saveGame() {
    SaveSystem.save(Game.state);
    UI.closePopup();
    
    // Show brief feedback
    const btn = document.getElementById('btn-save');
    const original = btn.textContent;
    btn.textContent = '✓';
    setTimeout(() => {
      btn.textContent = original;
    }, 1000);
  },
  
  afterLevelUp() {
    // Apply level up
    const selected = /** @type {HTMLElement | null} */ (document.querySelector('.levelup-stat.selected'));
    if (selected) {
      const stat = /** @type {StatKey} */ (selected.dataset.stat);
      SpecialSystem.increase(stat);
    }
    
    Game.state.levelUpPoints = Math.max(0, (Game.state.levelUpPoints || 1) - 1);
    
    // A stat increase may unlock a perk (e.g. pushing a stat to 10)
    Game.refreshPerks();
    UI.renderPerks();
    
    // 🧠 Rapid Learner: spend remaining points one at a time
    if (Game.state.levelUpPoints > 0) {
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
