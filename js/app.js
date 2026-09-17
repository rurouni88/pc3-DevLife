// Main application entry point
const App = {
  init() {
    this.bindEvents();
    this.checkForSave();
    UI.initTooltipClose();
    UI.showScreen('title');
  },
  
  bindEvents() {
    // Title screen
    document.getElementById('btn-new-game').addEventListener('click', () => this.startNewGame());
    document.getElementById('btn-continue').addEventListener('click', () => this.continueGame());
    
    // Character creation
    document.getElementById('btn-back-char').addEventListener('click', () => UI.showScreen('title'));
    document.getElementById('btn-start-career').addEventListener('click', () => this.startCareer());
    
    // Game screen
    document.getElementById('btn-menu-toggle').addEventListener('click', () => UI.togglePanel(true));
    document.getElementById('btn-menu-toggle-main').addEventListener('click', () => {
      const panel = document.getElementById('side-panel');
      const isOpen = panel.classList.contains('open');
      UI.togglePanel(!isOpen);
    });
    document.getElementById('btn-close-panel').addEventListener('click', () => UI.closePanel());
    document.getElementById('panel-overlay').addEventListener('click', () => UI.closePanel());
    document.getElementById('btn-save').addEventListener('click', () => this.saveGame());
    
    // Level up screen
    document.getElementById('btn-continue-levelup').addEventListener('click', () => this.afterLevelUp());
    
    // Game over / Victory
    document.getElementById('btn-new-career').addEventListener('click', () => this.startNewGame());
    document.getElementById('btn-new-victory').addEventListener('click', () => this.startNewGame());
    
    // End-of-run consumable selection
    document.getElementById('btn-continue-gameover-cons').addEventListener('click', () => {
      const selected = document.querySelector('#gameover-cons-selection .consumable-select-item.selected');
      if (selected) {
        const id = selected.dataset.id;
        UI.applyEndOfRunConsumable(id);
      }
    });
    
    document.getElementById('btn-continue-victory-cons').addEventListener('click', () => {
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
    
    Game.state.levelUpPoints = 0;
    
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
