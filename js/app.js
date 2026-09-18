// Main application entry point
const App = {
  init() {
    this.bindEvents();
    this.checkForSave();
    UI.initTooltipClose();
    this.initHelpTabs();
    UI.showScreen('title');
    document.getElementById('version-badge').textContent = `v${CONFIG.version} ${CONFIG.versionLabel}`;
  },
  
  bindEvents() {
    // Safely bind a click handler; skip (with a warning) if the element
    // is missing so one absent element can't break all later bindings.
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
    document.querySelectorAll('.toolbar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const panelName = btn.dataset.panel;
        UI.openPopup(panelName);
      });
    });
    
    // Popup close buttons
    document.querySelectorAll('.popup-close').forEach(btn => {
      btn.addEventListener('click', () => UI.closePopup());
    });
    
    // Popup save confirm
    bind('btn-popup-save-confirm', () => {
      this.saveGame();
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
    
    // Level up screen
    bind('btn-continue-levelup', () => this.afterLevelUp());
    
    // Game over / Victory
    bind('btn-new-career', () => this.startNewGame());
    bind('btn-new-victory', () => this.startNewGame());
    
    // Help modal
    bind('btn-help-title', () => UI.openHelp());
    bind('btn-close-help', () => UI.closeHelp());
    
    // End-of-run consumable selection
    bind('btn-continue-gameover-cons', () => {
      const selected = document.querySelector('#gameover-cons-selection .consumable-select-item.selected');
      if (selected) {
        const id = selected.dataset.id;
        UI.applyEndOfRunConsumable(id);
      }
    });
    
    bind('btn-continue-victory-cons', () => {
      const selected = document.querySelector('#victory-consumables .consumable-select-item.selected');
      if (selected) {
        const id = selected.dataset.id;
        UI.applyVictoryConsumable(id);
      }
    });
  },
  
  checkForSave() {
    if (SaveSystem.hasSave()) {
      document.getElementById('btn-continue').style.display = 'block';
    }
  },
  
  initHelpTabs() {
    document.querySelectorAll('.modal-tab').forEach(tab => {
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
    const stats = {};
    const container = document.getElementById('stat-allocation');
    const rows = container.querySelectorAll('.stat-row');
    rows.forEach(row => {
      const label = row.querySelector('.stat-label').textContent;
      const valueEl = row.querySelector('.stat-value');
      stats[label] = parseInt(valueEl.textContent);
    });
    
    // Get starting consumables and equipment from meta
    const meta = JSON.parse(localStorage.getItem('devlife_meta') || '{}');
    const startingConsumables = (meta.startingConsumables || []).map(id => {
      return CONSUMABLES.find(c => c.id === id);
    }).filter(Boolean);
    const startingEquipment = (meta.startingEquipment || []).map(id => {
      return EQUIPMENT.find(e => e.id === id);
    }).filter(Boolean);
    
    // Create game
    Game.createCharacter(stats, startingConsumables, startingEquipment);
    
    // Initialize SPECIAL system
    SpecialSystem.init(stats);
    
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
    
    // Debug: check if event rendered
    setTimeout(() => {
      const eventContainer = document.getElementById('event-container');
      console.log('Event container HTML:', eventContainer ? eventContainer.innerHTML.substring(0, 100) : 'NULL');
    }, 100);
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
    const selected = document.querySelector('.levelup-stat.selected');
    if (selected) {
      const stat = selected.dataset.stat;
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
