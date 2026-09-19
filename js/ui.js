// UI Rendering
const UI = {
  currentScreen: 'title',
  
  // Audio context for sound effects
  audioCtx: null,
  
  // Initialize audio (must be called after user interaction)
  initAudio() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  },
  
  // Play a sound effect
  playSound(type) {
    if (!this.audioCtx) this.initAudio();
    if (!this.audioCtx) return;
    
    const ctx = this.audioCtx;
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
  flashScreen(color, duration = 300) {
    const flash = document.createElement('div');
    flash.className = 'screen-flash';
    flash.style.backgroundColor = color;
    document.body.appendChild(flash);
    
    setTimeout(() => flash.remove(), duration);
  },
  
  // Show toast notification
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
  showTooltip(item) {
    const tooltip = document.getElementById('item-tooltip');
    if (!tooltip) return;
    
    tooltip.querySelector('.tooltip-emoji').textContent = item.emoji || '';
    tooltip.querySelector('.tooltip-name').textContent = item.name || '';
    tooltip.querySelector('.tooltip-desc').textContent = item.desc || '';
    
    // Build effect text (only for consumables/equipment, not perks)
    let effectText = '';
    if (item.stat && item.bonus) {
      effectText = `+${item.bonus} ${item.stat === 'any' ? 'ANY stat' : STAT_META[item.stat]?.name || item.stat}`;
    } else if (item.multiplier) {
      effectText = `${item.multiplier}× stat (risky)`;
    } else if (item.effects) {
      effectText = Object.entries(item.effects).map(([s, v]) => `+${v} ${STAT_META[s]?.name || s}`).join(', ');
    }
    const effectEl = tooltip.querySelector('.tooltip-effect');
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
      this.hideTooltip();
    });
    
    // Close tooltip when clicking outside
    document.addEventListener('click', (e) => {
      if (tooltip.style.display === 'none') return;
      if (tooltip.contains(e.target)) return;
      if (e.target.classList.contains('cons-info')) return;
      this.hideTooltip();
    });
    
    // Close popup when clicking close button or overlay
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('popup-close')) {
        this.closePopup();
      }
      const activePopup = document.querySelector('.popup-panel.active');
      if (activePopup && e.target === activePopup) {
        this.closePopup();
      }
    });
  },
  
  // Help modal
  openHelp() {
    const modal = document.getElementById('help-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    this.setHelpTab('info');
    document.getElementById('help-version').textContent = `v${CONFIG.version} ${CONFIG.versionLabel}`;
  },
  
  closeHelp() {
    const modal = document.getElementById('help-modal');
    if (!modal) return;
    modal.style.display = 'none';
  },
  
  setHelpTab(tab) {
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`.modal-tab[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`help-${tab}`).classList.add('active');
  },
  
  // Show floating stat change
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
  renderConsumableItem(item, datasetAttrs) {
    const element = document.createElement('div');
    element.className = 'consumable-select-item';
    
    // Add custom dataset attributes
    if (datasetAttrs) {
      Object.entries(datasetAttrs).forEach(([key, value]) => {
        element.dataset[key] = value;
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
  formatConsumableStat(item) {
    if (item.multiplier) {
      return `<span class="cs-multiplier" style="color: var(--accent-yellow)">${item.multiplier > 1 ? item.multiplier + '× stat' : Math.abs(item.multiplier) * 100 + '% stat'}</span>`;
    }
    if (item.stat === 'any') {
      return `<span class="cs-stat-any" style="color: var(--accent-green)">+${item.bonus} to ANY stat</span>`;
    }
    const statName = STAT_META[item.stat]?.name || item.stat;
    return `<span class="cs-stat" style="color: ${STAT_META[item.stat]?.color || '#fff'}">+${item.bonus} ${statName}</span>`;
  },
  _presetToggleHandler: null,
  _presetCloseHandler: null,
  
  // Show a screen
  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(`screen-${screenId}`);
    if (screen) {
      screen.classList.add('active');
      this.currentScreen = screenId;
    }
  },
  
  // Render character creation screen
  renderCharacterCreation() {
    this._selectedPreset = null;
    const container = document.getElementById('stat-allocation');
    container.innerHTML = '';
    
    STAT_KEYS.forEach(key => {
      const meta = STAT_META[key];
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = `
        <span class="stat-label" style="color: ${meta.color}">${key}</span>
        <span class="stat-name">${meta.name}</span>
        <div class="stat-controls">
          <button class="stat-btn minus" data-stat="${key}" data-action="minus">−</button>
          <span class="stat-value" style="color: ${meta.color}">${SpecialSystem.stats[key]}</span>
          <button class="stat-btn plus" data-stat="${key}" data-action="plus">+</button>
        </div>
      `;
      container.appendChild(row);
    });
    
    // Read stats directly from DOM — always in sync
    const getStats = () => {
      const stats = {};
      STAT_KEYS.forEach(k => {
        const rows = container.querySelectorAll('.stat-row');
        for (const row of rows) {
          if (row.querySelector('.stat-label').textContent === k) {
            stats[k] = parseInt(row.querySelector('.stat-value').textContent);
            break;
          }
        }
      });
      return stats;
    };
    
    // Bind events
    container.querySelectorAll('.stat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const stat = btn.dataset.stat;
        const action = btn.dataset.action;
        const row = btn.closest('.stat-row');
        const valueEl = row.querySelector('.stat-value');
        const cur = parseInt(valueEl.textContent);
        const stats = getStats();
        const total = STAT_KEYS.reduce((s, k) => s + stats[k], 0);
        
        if (action === 'plus' && cur < 10 && total < STARTING_POINTS) {
          valueEl.textContent = cur + 1;
          this._selectedPreset = null;
          this.updateCharCreationUI();
        } else if (action === 'minus' && cur > 1) {
          valueEl.textContent = cur - 1;
          this._selectedPreset = null;
          this.updateCharCreationUI();
        }
      });
    });
    
    this.updateCharCreationUI();
    this.renderArchetypePresets();
    this.renderStatDescriptions();
  },
  
  // Render archetype preset dropdown
  renderArchetypePresets() {
    const container = document.getElementById('preset-options');
    const toggle = document.getElementById('preset-toggle');
    const toggleText = document.getElementById('preset-toggle-text');
    container.innerHTML = '';
    
    // Remove old listeners to prevent duplicates on re-render
    if (this._presetToggleHandler) toggle.removeEventListener('click', this._presetToggleHandler);
    if (this._presetCloseHandler) document.removeEventListener('click', this._presetCloseHandler);
    
    // All archetypes are unlocked except Prototype King, which depends on the
    // not-yet-implemented max-stat > 10 mechanic.
    const UNLOCKED_KEYS = Object.keys(ARCHETYPES).filter(key => key !== 'prototype_king');
    
    Object.entries(ARCHETYPES).forEach(([key, arch]) => {
      const btn = document.createElement('button');
      btn.className = 'preset-option';
      const unlocked = UNLOCKED_KEYS.includes(key);
      
      const statStr = STAT_KEYS.map(k => `${k}:${arch.stats[k]}`).join(' ');
      
      if (!unlocked) {
        btn.classList.add('locked');
        btn.innerHTML = `
          <span class="preset-name">🔒 ${arch.name}</span>
          <span class="preset-stats">Locked</span>
        `;
      } else {
        btn.innerHTML = `
          <span class="preset-name">${arch.name}</span>
          <span class="preset-stats">${statStr}</span>
        `;
        btn.addEventListener('click', () => {
          this.applyArchetypePreset(arch.stats, arch);
          // Close dropdown and update toggle text
          container.classList.remove('open');
          toggle.classList.remove('open');
          toggleText.textContent = arch.name;
        });
      }
      
      container.appendChild(btn);
    });
    
    // Toggle dropdown
    this._presetToggleHandler = () => {
      const isOpen = container.classList.contains('open');
      container.classList.toggle('open');
      toggle.classList.toggle('open');
    };
    toggle.addEventListener('click', this._presetToggleHandler);
    
    // Close dropdown when clicking outside
    this._presetCloseHandler = (e) => {
      const dropdown = document.getElementById('preset-dropdown');
      if (!dropdown.contains(e.target)) {
        container.classList.remove('open');
        toggle.classList.remove('open');
      }
    };
    document.addEventListener('click', this._presetCloseHandler);
  },
  
  // Apply an archetype preset to the stat allocation
  applyArchetypePreset(stats, arch) {
    const container = document.getElementById('stat-allocation');
    const rows = container.querySelectorAll('.stat-row');
    
    rows.forEach(row => {
      const label = row.querySelector('.stat-label').textContent;
      const valueEl = row.querySelector('.stat-value');
      const minusBtn = row.querySelector('.stat-btn.minus');
      const plusBtn = row.querySelector('.stat-btn.plus');
      
      const value = stats[label];
      valueEl.textContent = value;
      
      minusBtn.disabled = value <= 1;
      plusBtn.disabled = value >= 10;
    });
    
    const currentStats = {};
    rows.forEach(row => {
      const label = row.querySelector('.stat-label').textContent;
      currentStats[label] = parseInt(row.querySelector('.stat-value').textContent);
    });
    
    // Remember which preset was chosen so the preview can show it directly
    // (its stats may be too flat to classify uniquely).
    this._selectedPreset = arch || null;
    this.updateCharCreationUI();
  },
  
  // Render stat descriptions
  renderStatDescriptions() {
    const container = document.getElementById('stat-descriptions');
    if (!container) return;
    
    let html = `
      <button class="desc-toggle" id="btn-toggle-descs">
        <span id="desc-arrow">▶</span> What does each stat do?
      </button>
      <div class="desc-content" id="desc-content">
    `;
    
    STAT_KEYS.forEach(key => {
      const meta = STAT_META[key];
      html += `
        <div class="stat-desc-item" style="border-left-color: ${meta.color}">
          <div class="desc-label" style="color: ${meta.color}">${key} — ${meta.short}</div>
          <div class="desc-text">${meta.desc}</div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Toggle button
    const toggleBtn = document.getElementById('btn-toggle-descs');
    const content = document.getElementById('desc-content');
    const arrow = document.getElementById('desc-arrow');
    
    const toggleHandler = () => {
      const isOpen = content.classList.contains('open');
      if (isOpen) {
        content.classList.remove('open');
        arrow.textContent = '▶';
      } else {
        content.classList.add('open');
        arrow.textContent = '▼';
      }
    };
    toggleBtn.addEventListener('click', toggleHandler);
  },
  
  // Update character creation UI state
  updateCharCreationUI() {
    const container = document.getElementById('stat-allocation');
    const currentStats = {};
    
    const rows = container.querySelectorAll('.stat-row');
    rows.forEach(row => {
      const label = row.querySelector('.stat-label').textContent;
      const valueEl = row.querySelector('.stat-value');
      currentStats[label] = parseInt(valueEl.textContent);
    });
    
    const total = STAT_KEYS.reduce((sum, k) => sum + currentStats[k], 0);
    const remaining = STARTING_POINTS - total;
    document.getElementById('points-remaining').textContent = remaining;
    
    const startBtn = document.getElementById('btn-start-career');
    startBtn.disabled = remaining !== 0;
    
    // Update button disabled states
    rows.forEach(row => {
      const label = row.querySelector('.stat-label').textContent;
      const minusBtn = row.querySelector('.stat-btn.minus');
      const plusBtn = row.querySelector('.stat-btn.plus');
      const value = currentStats[label];
      
      minusBtn.disabled = value <= 1;
      plusBtn.disabled = value >= 10 || total >= STARTING_POINTS;
    });
    
    // Update archetype preview
    this.updateArchetypePreview(currentStats);
  },
  
  // Update archetype preview based on current stats
  updateArchetypePreview(currentStats) {
    if (!currentStats) {
      const container = document.getElementById('stat-allocation');
      currentStats = {};
      STAT_KEYS.forEach(k => {
        const rows = container.querySelectorAll('.stat-row');
        for (const row of rows) {
          if (row.querySelector('.stat-label').textContent === k) {
            currentStats[k] = parseInt(row.querySelector('.stat-value').textContent);
            break;
          }
        }
      });
    }
    
    const preview = document.getElementById('archetype-preview');
    
    // If a preset was just selected, show that archetype directly. Some presets
    // (e.g. Full-Stack Generalist) have stats too flat to classify uniquely, so
    // the stats-based fallback below would mislabel them.
    let archetype = this._selectedPreset || null;
    
    if (!archetype) {
      // Determine archetype based on top 2 stats.
      // Sort a copy — Array.prototype.sort mutates in place, which would
      // permanently reorder the shared global STAT_KEYS and make the
      // tie-breaking (and thus the preview) depend on prior calls.
      const sorted = [...STAT_KEYS].sort((a, b) => currentStats[b] - currentStats[a]);
      const top1 = sorted[0];
      const top2 = sorted[1];
    
      if ((top1 === 'I' && top2 === 'C') || (top1 === 'C' && top2 === 'I')) archetype = ARCHETYPES.architect;
      else if ((top1 === 'A' && top2 === 'E') || (top1 === 'E' && top2 === 'A')) archetype = ARCHETYPES.startup;
      else if ((top1 === 'S' && top2 === 'P') || (top1 === 'P' && top2 === 'S')) archetype = ARCHETYPES.systems;
      else if ((top1 === 'C' && top2 === 'A') || (top1 === 'A' && top2 === 'C')) archetype = ARCHETYPES.advocate;
      else if ((top1 === 'P' && top2 === 'E') || (top1 === 'E' && top2 === 'P')) archetype = ARCHETYPES.sre;
      else if ((top1 === 'P' && top2 === 'I') || (top1 === 'I' && top2 === 'P')) archetype = ARCHETYPES.pentester;
      else if ((top1 === 'S' && top2 === 'E') || (top1 === 'E' && top2 === 'S')) archetype = ARCHETYPES.archeologist;
      else if ((top1 === 'C' && top2 === 'E') || (top1 === 'E' && top2 === 'C')) archetype = ARCHETYPES.em;
      else if ((top1 === 'A' && top2 === 'L') || (top1 === 'L' && top2 === 'A')) archetype = ARCHETYPES.prototype_king;
      else archetype = ARCHETYPES.balanced;
    }
    
    preview.innerHTML = `
      <div class="archetype-name">${archetype.name}</div>
      <div class="archetype-desc">${archetype.description}</div>
    `;
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
  
  // Render SPECIAL stats in game
  renderSpecialStats() {
    const container = document.getElementById('special-stats');
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
    
    this.renderPerks();
  },
  
  // Render equipment
  renderEquipment() {
    const container = document.getElementById('equipment-list');
    const equipment = Game.state.equipment;
    
    if (equipment.length === 0) {
      container.innerHTML = '<span class="empty-text">No equipment yet</span>';
      return;
    }
    
    container.innerHTML = '';
    equipment.forEach(item => {
      const effectText = Object.entries(item.effects).map(([k,v]) => `+${v} ${STAT_META[k].name}`).join(', ');
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
    const log = Game.state.careerLog.slice(0, 20);
    
    container.innerHTML = '';
    log.forEach((entry, i) => {
      const el = document.createElement('div');
      el.className = `log-entry ${i === 0 ? 'recent' : ''}`;
      const careerYear = Math.ceil(entry.day / 12);
      el.textContent = `Year ${careerYear}: ${entry.message}`;
      container.appendChild(el);
    });
    
    // Also update recent activity in main game area
    this.renderRecentActivity();
  },
  
  // Render recent activity (mobile-friendly)
  renderRecentActivity() {
    const container = document.getElementById('recent-log-entries');
    if (!container) return;
    
    const recentEntries = Game.state.careerLog.slice(0, 3);
    
    container.innerHTML = '';
    recentEntries.forEach((entry, i) => {
      const el = document.createElement('div');
      el.className = `recent-log-entry ${i === 0 ? 'recent' : ''}`;
      const careerYear = Math.ceil(entry.day / 12);
      el.textContent = `Year ${careerYear}: ${entry.message}`;
      container.appendChild(el);
    });
  },
  
  // Render top bar
  renderTopBar() {
    const phaseNames = ['', 'Junior Developer', 'Mid-Level Developer', 'Senior Developer', 'Staff/Principal'];
    document.getElementById('career-phase').textContent = phaseNames[Game.state.phase];
    // Career spans ~8-10 years across ~24 events, each event ~0.4 years
    const careerYear = Math.ceil(Game.state.day / 12);
    document.getElementById('career-day').textContent = `Year ${careerYear}`;
    document.getElementById('player-level').textContent = Game.state.level;
    
    // Progress toward next boss (🚀 Fast Ship: 5 instead of 6)
    const progressText = this.progressText();
    document.getElementById('level-progress').textContent = progressText;
    document.getElementById('level-progress-top').textContent = `Level ${Game.state.level} · ${progressText}`;
  },
  
  // Progress text toward next boss (or level-up indicator)
  progressText() {
    const bossEvery = PerkSystem.bossInterval();
    const eventsInCycle = Game.state.eventsCompleted % bossEvery;
    return Game.state.levelUpPoints > 0 ? 'LEVEL UP!' : `${eventsInCycle}/${bossEvery}`;
  },
  
  // Render an event
  renderEvent(event) {
    const container = document.getElementById('event-container');
    const letters = ['A', 'B', 'C', 'D'];
    
    const card = document.createElement('div');
    card.className = 'event-card';
    card.id = 'event-card';
    
    // Build consumable buttons if player has any
    let consumableHTML = '';
    if (Game.state.consumables.length > 0) {
      const grouped = {};
      Game.state.consumables.forEach(c => {
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
    
    card.innerHTML = `
      <div class="event-header">
        <div class="event-phase">${event.phaseLabel}</div>
        <div class="event-title">${event.title}</div>
      </div>
      <div class="event-body">
        <div class="event-narrative">${event.narrative}</div>
        ${consumableHTML}
        <div class="event-choices">
          ${event.choices.map((choice, i) => {
            const checks = Object.entries(choice.checks || {});
            const checkHTML = checks.length > 0
              ? `<div class="choice-checks">${checks.map(([stat, target]) => {
                  const currentStat = SpecialSystem.effective(stat);
                  const success = currentStat >= target;
                  return `<span class="check ${success ? 'success' : 'fail'}">${STAT_META[stat].name}: ${target} ${success ? '✓' : '✗'}</span>`;
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
    card.querySelectorAll('.cons-btn').forEach(btn => {
      const infoBtn = btn.querySelector('.cons-info');
      if (infoBtn) {
        // Desktop: hover to show
        infoBtn.addEventListener('mouseenter', () => {
          const id = infoBtn.dataset.id;
          const consumable = CONSUMABLES.find(c => c.id === id);
          if (consumable) this.showTooltip(consumable);
        });
        infoBtn.addEventListener('mouseleave', () => {
          this.hideTooltip();
        });
        // Mobile: tap to show (stays until tapped elsewhere)
        infoBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = e.target.dataset.id;
          const consumable = CONSUMABLES.find(c => c.id === id);
          if (consumable) {
            this.showTooltip(consumable);
          }
        });
      }
      btn.addEventListener('click', (e) => {
        if (!e.target.classList.contains('cons-info')) {
          this.useConsumable(btn.dataset.id, event);
        }
      });
    });
    
    // Bind choice buttons
    card.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.playSound('click');
        const choiceIndex = parseInt(btn.dataset.choice);
        this.handleChoice(event, choiceIndex);
      });
    });
  },
  
  // Use a consumable before a choice
  useConsumable(id, event) {
    const result = ConsumableManager.use(id);
    if (!result) return;
    
    // Determine which stat to boost
    let stat = 'E';
    for (const choice of event.choices) {
      if (choice.checks) {
        const entries = Object.entries(choice.checks);
        if (entries.length > 0) {
          stat = entries[0][0];
          break;
        }
      }
    }
    
    // Handle multiplier (AI) consumables
    if (result.multiplier !== undefined) {
      SpecialSystem.applyMultiplier(result.multiplier);
      this.renderSpecialStats();
      
      // Show feedback
      const container = document.getElementById('event-container');
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
      
      const body = container.querySelector('.event-body');
      const consumableBar = body.querySelector('.consumable-bar');
      if (consumableBar) {
        consumableBar.parentNode.insertBefore(feedback, consumableBar.nextSibling);
        setTimeout(() => feedback.remove(), 3000);
      }
      
      this.renderEvent(event);
      return;
    }
    
    // Handle normal bonus consumables
    if (result.stat === 'any') {
      STAT_KEYS.forEach(s => SpecialSystem.applyTempBonus(s, result.bonus));
    } else {
      SpecialSystem.applyTempBonus(result.stat, result.bonus);
    }
    
    this.renderSpecialStats();
    
    // Show feedback
    const container = document.getElementById('event-container');
    const feedback = document.createElement('div');
    feedback.className = 'consumable-feedback';
    const statName = result.stat === 'any' ? 'All Stats' : (STAT_META[result.stat]?.name || result.stat);
    feedback.innerHTML = `${result.emoji} ${result.name} used! +${result.bonus} ${statName}`;
    
    const body = container.querySelector('.event-body');
    const consumableBar = body.querySelector('.consumable-bar');
    if (consumableBar) {
      consumableBar.parentNode.insertBefore(feedback, consumableBar.nextSibling);
      setTimeout(() => feedback.remove(), 2000);
    }
    
    this.renderEvent(event);
  },
  
  // Handle a choice selection
  handleChoice(event, choiceIndex) {
    const result = Game.processChoice(event, choiceIndex);
    if (result.error) {
      console.error(result.error);
      return;
    }
    
    // Update UI elements
    this.renderSpecialStats();
    this.renderEquipment();
    this.renderCareerLog();
    this.renderTopBar();
    
    // Show floating stat changes
    for (const [stat, value] of Object.entries(result.effects)) {
      if (value !== 0) {
        this.showStatFloat(stat, value);
      }
    }
    
    // Show toast notifications and play sounds for milestones
    if (result.leveledUp) {
      this.showToast(`📈 Level Up! Now level ${Game.state.level}`, 'success');
      this.playSound('levelup');
    } else if (result.bossDefeated) {
      this.showToast('🏆 Boss Defeated!', 'success');
      this.playSound('boss');
      this.flashScreen('rgba(0, 255, 136, 0.3)');
    } else if (result.itemDropped) {
      this.showToast(`🎁 Found: ${result.itemDropped.emoji} ${result.itemDropped.name}`, 'success');
      this.playSound('success');
    } else if (result.gameOver) {
      this.showToast('💀 Career Over', 'error');
      this.playSound('gameover');
      this.flashScreen('rgba(255, 0, 0, 0.4)');
    } else if (result.victory) {
      this.showToast('🏆 Retirement!', 'success');
      this.playSound('victory');
      this.flashScreen('rgba(255, 215, 0, 0.3)');
    } else {
      // Regular choice sound
      this.playSound(result.success ? 'success' : 'failure');
    }
    
    // Show result in event card
    const card = document.getElementById('event-card');
    const body = card.querySelector('.event-body');
    body.querySelector('.event-choices').style.display = 'none';
    
    const resultDiv = document.createElement('div');
    resultDiv.className = 'event-result';
    
    let resultHTML = `<div class="result-text ${result.success ? 'success' : 'failure'}">${result.log}</div>`;
    
    // Show stat changes
    const statChanges = [];
    for (const [stat, value] of Object.entries(result.effects)) {
      if (value !== 0) {
        statChanges.push(`<span class="stat-change ${value > 0 ? 'positive' : 'negative'}">${STAT_META[stat].name}: ${value > 0 ? '+' : ''}${value}</span>`);
      }
    }
    if (statChanges.length > 0) {
      resultHTML += `<div class="stat-changes">${statChanges.join('')}</div>`;
    }
    
    // Show item drop
    let showEquipmentChoice = false;
    if (result.equipmentDropped) {
      // Inventory full — the item is held in pendingEquipmentDrop; show choice screen
      const pending = Game.state.pendingEquipmentDrop;
      resultHTML += `<div class="item-drop">🎁 Found: ${pending.emoji} ${pending.name} — inventory full!</div>`;
      showEquipmentChoice = true;
    } else if (result.itemDropped) {
      // Item already added to inventory by Game.checkForEquipmentDrop()
      resultHTML += `<div class="item-drop">🎁 Found: ${result.itemDropped.emoji} ${result.itemDropped.name}</div>`;
      this.renderEquipment();
    }
    
    // Show check results
    if (result.checkResults && result.checkResults.length > 0) {
      const checkHTML = result.checkResults.map(cr => 
        `<span class="stat-change ${cr.success ? 'positive' : 'negative'}">${cr.stat}: rolled ${cr.roll} vs ${cr.target} ${cr.success ? (cr.negotiated ? '🤝' : '✓') : '✗'}</span>`
      ).join('');
      resultHTML += `<div class="stat-changes">${checkHTML}</div>`;
    }
    
    // Negotiate prompt
    let negotiateHTML = '';
    if (result.hasNegotiate) {
      resultHTML += `<div class="negotiate-prompt">🤝 <strong>Negotiate!</strong> Use your once-per-run reroll to turn this around?</div>`;
      negotiateHTML = `
        <button class="btn btn-primary" id="btn-negotiate-yes">🤝 Use Negotiate</button>
        <button class="btn btn-ghost" id="btn-negotiate-no">No, thanks</button>
      `;
    }
    
    // Continue button
    let continueText = 'Continue →';
    if (result.gameOver) continueText = 'View Results →';
    else if (result.victory) continueText = 'View Retirement →';
    else if (result.leveledUp) continueText = 'Level Up →';
    else if (result.phaseComplete) continueText = 'Continue →';
    else if (result.bossDefeated) continueText = 'Boss Defeated — Continue →';
    
    resultHTML += `<div class="result-actions">${negotiateHTML}<button class="btn btn-primary btn-continue" id="btn-continue-event">${continueText}</button></div>`;
    
    resultDiv.innerHTML = resultHTML;
    body.appendChild(resultDiv);
    
    // Bind Negotiate buttons
    const btnNegotiateYes = document.getElementById('btn-negotiate-yes');
    const btnNegotiateNo = document.getElementById('btn-negotiate-no');
    if (btnNegotiateYes) {
      btnNegotiateYes.addEventListener('click', () => {
        Game.useNegotiate();
        // Re-render the result as success
        resultDiv.querySelector('.result-text').classList.remove('failure');
        resultDiv.querySelector('.result-text').classList.add('success');
        resultDiv.querySelector('.result-text').textContent = result.log;
        // Update stat changes
        const statChanges = resultDiv.querySelector('.stat-changes:last-of-type');
        if (statChanges) {
          statChanges.innerHTML = result.checkResults.map(cr => 
            `<span class="stat-change positive">${cr.stat}: rolled ${cr.roll} vs ${cr.target} 🤝</span>`
          ).join('');
        }
        // Remove negotiate buttons, update continue
        const actions = resultDiv.querySelector('.result-actions');
        actions.innerHTML = `<button class="btn btn-primary btn-continue" id="btn-continue-event">Continue →</button>`;
        document.getElementById('btn-continue-event').addEventListener('click', () => {
          this.nextEvent();
        });
      });
    }
    if (btnNegotiateNo) {
      btnNegotiateNo.addEventListener('click', () => {
        const actions = resultDiv.querySelector('.result-actions');
        actions.innerHTML = `<button class="btn btn-primary btn-continue" id="btn-continue-event">Continue →</button>`;
        document.getElementById('btn-continue-event').addEventListener('click', () => {
          this.nextEvent();
        });
      });
    }
    
    // Bind continue button
    document.getElementById('btn-continue-event').addEventListener('click', () => {
      if (showEquipmentChoice) {
        UI.showEquipmentChoice(Game.state.pendingEquipmentDrop, [...Game.state.equipment]);
      } else if (result.gameOver) {
        this.showGameOver(result.gameOver.reason);
      } else if (result.victory) {
        this.showVictory();
      } else if (result.leveledUp) {
        this.showLevelUpStats();
      } else if (result.phaseComplete) {
        Game.advancePhase();
        this.renderTopBar();
        this.renderCareerLog();
        this.nextEvent();
      } else {
        this.nextEvent();
      }
    });
  },
  
  // Get next event
  nextEvent() {
    if (!Game.state) {
      console.error('[DevLife] Game.state is null');
      const container = document.getElementById('event-container');
      container.innerHTML = '<div class="event-card"><div class="event-body"><p style="color: var(--accent-red)">Error: Game state not initialized</p></div></div>';
      return;
    }
    
    const excludeIds = Game.state.eventHistory || [];
    let event;
    
    // If boss already defeated, advance to next phase
    if (Game.state.bossCompleted) {
      Game.advancePhase();
      this.renderTopBar();
      this.nextEvent();
      return;
    }
    
    // Boss every N events (eventsCompleted is incremented AFTER this call)
    // 🚀 Fast Ship: bosses every 5 events instead of 6
    if ((Game.state.eventsCompleted + 1) % PerkSystem.bossInterval() === 0) {
      event = getBossEvent(Game.state.phase);
    } else {
      event = getRandomNonBossEvent(Game.state.phase, excludeIds);
      // Fallback to boss if we've seen all non-boss events
      if (!event) {
        event = getBossEvent(Game.state.phase);
      }
    }
    
    if (!event) {
      Game.advancePhase();
      this.renderTopBar();
      this.nextEvent();
      return;
    }
    
    this.renderEvent(event);
  },
  
  // Show consumable selection screen after level up
  showLevelUpConsumableSelection() {
    const options = Game.state.pendingLevelUpConsumables;
    const hasFullInventory = Game.state.consumables.length >= 2;
    
    // Show the level up screen first
    this.showScreen('levelup');
    
    // Update description
    const descEl = document.getElementById('levelup-desc');
    const descNote = '<span style="font-size: 0.8rem; color: var(--text-muted);">(Consumables are one-time use for a single event — use them wisely!)</span>';
    if (hasFullInventory) {
      descEl.innerHTML = `You've reached Level <span id="new-level">${Game.state.level}</span>. Pick a consumable and choose which to replace. ${descNote}`;
    } else {
      descEl.innerHTML = `You've reached Level <span id="new-level">${Game.state.level}</span>. Pick a consumable to add to your stash. ${descNote}`;
    }
    
    // Show consumables container
    document.getElementById('levelup-consumables').style.display = 'block';
    document.getElementById('levelup-stats-container').style.display = 'none';
    document.getElementById('btn-skip-levelup').style.display = 'block';
    document.getElementById('btn-continue-levelup').style.display = 'block';
    document.getElementById('btn-continue-levelup').disabled = true;
    
    const container = document.getElementById('levelup-consumables');
    container.innerHTML = '';
    
    // Show new consumable options
    const optionsLabel = document.createElement('div');
    optionsLabel.className = 'consumable-selection-label';
    optionsLabel.textContent = hasFullInventory ? 'Choose a new consumable:' : 'Choose a consumable:';
    optionsLabel.style.cssText = 'font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-green); margin-bottom: var(--spacing-sm); text-transform: uppercase;';
    container.appendChild(optionsLabel);
    
    options.forEach((newConsumable) => {
      const itemElement = UI.renderConsumableItem(newConsumable, { id: newConsumable.id });
      itemElement.addEventListener('click', () => {
        container.querySelectorAll('.consumable-select-item').forEach(s => s.classList.remove('selected'));
        itemElement.classList.add('selected');
        document.getElementById('btn-continue-levelup').disabled = false;
      });
      container.appendChild(itemElement);
    });
    
    // If inventory is full, show current consumables for swapping
    let selectedIndex = -1;
    if (hasFullInventory) {
      const currentLabel = document.createElement('div');
      currentLabel.className = 'consumable-selection-label';
      currentLabel.textContent = 'Your current stash (click to replace):';
      currentLabel.style.cssText = 'font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-yellow); margin-top: var(--spacing-lg); margin-bottom: var(--spacing-sm); text-transform: uppercase;';
      container.appendChild(currentLabel);
      
      Game.state.consumables.forEach((currentConsumable, inventoryIndex) => {
        const itemElement = UI.renderConsumableItem(currentConsumable, { replaceIndex: inventoryIndex });
        itemElement.addEventListener('click', () => {
          container.querySelectorAll('[data-replace-index]').forEach(s => s.classList.remove('selected'));
          itemElement.classList.add('selected');
          selectedIndex = inventoryIndex;
        });
        container.appendChild(itemElement);
      });
    }
    
    // Bind skip button — skip consumable, finish level up
    document.getElementById('btn-skip-levelup').onclick = () => {
      Game.state.pendingLevelUpConsumables = null;
      App.afterLevelUp();
    };
    
    // Bind continue button
    document.getElementById('btn-continue-levelup').onclick = () => {
      const selected = container.querySelector('.consumable-select-item.selected');
      if (!selected) return;
      
      const id = selected.dataset.id;
      const consumable = CONSUMABLES.find(c => c.id === id);
      if (!consumable) return;
      
      // Handle the consumable selection
      if (hasFullInventory) {
        // Inventory full — must replace a selected consumable
        if (selectedIndex >= 0) {
          Game.state.consumables[selectedIndex] = { ...consumable };
        }
        // If selectedIndex is -1, don't add anything (user didn't pick what to replace)
      } else {
        // Add to inventory
        Game.state.consumables.push({ ...consumable });
      }
      
      // Clear pending consumables
      Game.state.pendingLevelUpConsumables = null;
      
      // Finish level up
      App.afterLevelUp();
    };
  },
  
  // Show stat selection screen
  showLevelUpStats() {
    this.showScreen('levelup');
    
    // Update description (stat selection phase)
    const descEl = document.getElementById('levelup-desc');
    descEl.innerHTML = `You've reached Level <span id="new-level">${Game.state.level}</span>. Choose a stat to increase.`;
    
    // Show remaining points (🧠 Rapid Learner can grant 2+)
    const pointsEl = document.getElementById('levelup-points');
    const points = Game.state.levelUpPoints || 1;
    pointsEl.textContent = points > 1 ? `You have ${points} points to spend — choose one at a time.` : '';
    pointsEl.style.display = points > 1 ? 'block' : 'none';
    
    document.getElementById('levelup-consumables').style.display = 'none';
    document.getElementById('levelup-stats-container').style.display = 'block';
    document.getElementById('btn-skip-levelup').style.display = 'none';
    document.getElementById('btn-continue-levelup').style.display = 'block';
    
    const container = document.getElementById('levelup-stats');
    container.innerHTML = '';
    
    STAT_KEYS.forEach(key => {
      const meta = STAT_META[key];
      const canIncrease = SpecialSystem.canIncrease(key);
      
      const stat = document.createElement('div');
      stat.className = `levelup-stat ${!canIncrease ? 'disabled' : ''}`;
      stat.dataset.stat = key;
      stat.innerHTML = `
        <span class="stat-letter" style="color: ${meta.color}">${key}</span>
        <div class="stat-details">
          <div class="stat-name">${meta.name}</div>
          <div class="stat-current">${SpecialSystem.stats[key]} ${canIncrease ? '→ ' + (SpecialSystem.stats[key] + 1) : '(MAX)'}</div>
        </div>
      `;
      
      if (canIncrease) {
        stat.addEventListener('click', () => {
          container.querySelectorAll('.levelup-stat').forEach(s => s.classList.remove('selected'));
          stat.classList.add('selected');
          document.getElementById('btn-continue-levelup').disabled = false;
        });
      }
      
      container.appendChild(stat);
    });
    
    document.getElementById('btn-continue-levelup').disabled = true;
    
    // Bind continue button — spend points one at a time; consumables come
    // after the last point is spent, otherwise continue straight away.
    document.getElementById('btn-continue-levelup').onclick = () => {
      if ((Game.state.levelUpPoints || 1) > 1) {
        App.afterLevelUp();
      } else if (Game.state.pendingLevelUpConsumables && Game.state.pendingLevelUpConsumables.length > 0) {
        UI.showLevelUpConsumableSelection();
      } else {
        App.afterLevelUp();
      }
    };
  },
  
  // Show game over screen
  showGameOver(reason) {
    Game.saveRunComplete();
    
    // Show consumable selection first
    this.showConsumableSelection('gameover');
    document.getElementById('gameover-reason').textContent = reason;
  },
  
  // Show consumable selection at end of run
  showConsumableSelection(type) {
    const options = ConsumableManager.getEndOfRunOptions();
    
    if (type === 'gameover') {
      // Game over screen
      const container = document.getElementById('gameover-cons-selection');
      const continueBtn = document.getElementById('btn-continue-gameover-cons');
      container.innerHTML = '';
      continueBtn.disabled = true;
      options.forEach((item, i) => {
        const el = document.createElement('div');
        el.className = 'consumable-select-item';
        el.dataset.id = item.id;
        el.innerHTML = `
          <span class="cs-emoji">${item.emoji}</span>
          <div class="cs-details">
            <div class="cs-name">${item.name}</div>
            <div class="cs-desc">${item.desc}</div>
          </div>
        `;
        el.addEventListener('click', () => {
          container.querySelectorAll('.consumable-select-item').forEach(s => s.classList.remove('selected'));
          el.classList.add('selected');
          continueBtn.disabled = false;
        });
        container.appendChild(el);
      });
      this.showScreen('gameover-cons');
    } else {
      // Victory screen
      const consContainer = document.getElementById('victory-consumables');
      const summaryContainer = document.getElementById('victory-summary');
      const continueBtn = document.getElementById('btn-continue-victory-cons');
      const buttonsContainer = document.getElementById('victory-buttons');
      
      consContainer.style.display = 'block';
      summaryContainer.style.display = 'none';
      continueBtn.style.display = 'block';
      continueBtn.disabled = true;
      buttonsContainer.style.display = 'none';
      
      consContainer.innerHTML = '';
      options.forEach((item, i) => {
        const el = document.createElement('div');
        el.className = 'consumable-select-item';
        el.dataset.id = item.id;
        el.innerHTML = `
          <span class="cs-emoji">${item.emoji}</span>
          <div class="cs-details">
            <div class="cs-name">${item.name}</div>
            <div class="cs-desc">${item.desc}</div>
          </div>
        `;
        el.addEventListener('click', () => {
          consContainer.querySelectorAll('.consumable-select-item').forEach(s => s.classList.remove('selected'));
          el.classList.add('selected');
          continueBtn.disabled = false;
        });
        consContainer.appendChild(el);
      });
      this.showScreen('victory');
    }
  },
  
  // Apply selected consumable and show game over
  applyEndOfRunConsumable(selectedId) {
    // Add to meta for next run (store ID only)
    const meta = JSON.parse(localStorage.getItem('devlife_meta') || '{}');
    if (!meta.startingConsumables) meta.startingConsumables = [];
    
    // Only add if not already in the list
    if (!meta.startingConsumables.includes(selectedId)) {
      meta.startingConsumables.push(selectedId);
    }
    localStorage.setItem('devlife_meta', JSON.stringify(meta));
    
    // Show game over summary
    SaveSystem.deleteSave();
    this.showScreen('gameover');
    
    const summary = Game.getSummary();
    const container = document.getElementById('gameover-summary');
    container.innerHTML = `
      <div class="summary-row"><span class="label">Run #</span><span class="value">${summary.runNumber}</span></div>
      <div class="summary-row"><span class="label">Level Reached</span><span class="value">${summary.level}</span></div>
      <div class="summary-row"><span class="label">Career Phase</span><span class="value">${summary.phase}/4</span></div>
      <div class="summary-row"><span class="label">Career Length</span><span class="value">${(summary.day / 12).toFixed(1)} years</span></div>
      <div class="summary-row"><span class="label">Events Completed</span><span class="value">${summary.eventsCompleted}</span></div>
      <div class="summary-row"><span class="label">Equipment</span><span class="value">${summary.equipment.length}</span></div>
      <div class="summary-row"><span class="label">Stats</span><span class="value">${STAT_KEYS.map(k => `${k}:${SpecialSystem.stats[k]}`).join(' ')}</span></div>
    `;
  },
  
  // Apply selected consumable and show victory summary
  applyVictoryConsumable(selectedId) {
    // Add to meta for next run (store ID only)
    const meta = JSON.parse(localStorage.getItem('devlife_meta') || '{}');
    if (!meta.startingConsumables) meta.startingConsumables = [];
    
    // Only add if not already in the list
    if (!meta.startingConsumables.includes(selectedId)) {
      meta.startingConsumables.push(selectedId);
    }
    localStorage.setItem('devlife_meta', JSON.stringify(meta));
    
    // Hide consumable selection, show summary
    document.getElementById('victory-consumables').style.display = 'none';
    document.getElementById('btn-continue-victory-cons').style.display = 'none';
    const summaryContainer = document.getElementById('victory-summary');
    summaryContainer.style.display = 'block';
    document.getElementById('victory-buttons').style.display = 'flex';
    
    SaveSystem.deleteSave();
    
    const summary = Game.getSummary();
    summaryContainer.innerHTML = `
      <div class="summary-row"><span class="label">Run #</span><span class="value">${summary.runNumber}</span></div>
      <div class="summary-row"><span class="label">Final Level</span><span class="value">${summary.level}</span></div>
      <div class="summary-row"><span class="label">Career Phase</span><span class="value">${summary.phase}/4 🏆</span></div>
      <div class="summary-row"><span class="label">Career Length</span><span class="value">${(summary.day / 12).toFixed(1)} years</span></div>
      <div class="summary-row"><span class="label">Events Completed</span><span class="value">${summary.eventsCompleted}</span></div>
      <div class="summary-row"><span class="label">Equipment Collected</span><span class="value">${summary.equipment.length}</span></div>
      <div class="summary-row"><span class="label">Final Stats</span><span class="value">${STAT_KEYS.map(k => `${k}:${SpecialSystem.stats[k]}`).join(' ')}</span></div>
    `;
  },
  
  // Show victory screen with consumable selection
  showVictory() {
    Game.saveRunComplete();
    this.showConsumableSelection('victory');
  },
  
  // Toggle side panel (mobile)
  togglePanel(open) {
    const panel = document.getElementById('side-panel');
    const overlay = document.getElementById('panel-overlay');
    
    if (open) {
      panel.classList.add('open');
      overlay.classList.add('visible');
    } else {
      panel.classList.remove('open');
      overlay.classList.remove('visible');
    }
  },
  
  // Close side panel
  closePanel() {
    this.togglePanel(false);
  },
  
  // Show equipment choice screen (when inventory is full)
  showEquipmentChoice(newEquipment, currentEquipment) {
    const newContainer = document.getElementById('equipment-choice-new');
    const currentContainer = document.getElementById('equipment-choice-current');
    const keepBtn = document.getElementById('btn-keep-equipment');
    const skipBtn = document.getElementById('btn-skip-equipment');
    
    // Show new equipment
    newContainer.innerHTML = '';
    const newEl = document.createElement('div');
    newEl.className = 'consumable-select-item';
    newEl.style.borderColor = 'var(--accent-green)';
    const statStr = Object.entries(newEquipment.effects).map(([k,v]) => `+${v} ${STAT_META[k].name}`).join(', ');
    newEl.innerHTML = `
      <span class="cs-emoji" style="font-size: 2em;">${newEquipment.emoji}</span>
      <div class="cs-details">
        <div class="cs-name">${newEquipment.name}</div>
        <div class="cs-desc">${newEquipment.desc}</div>
        <div class="cs-effect">${statStr}</div>
      </div>
      <div class="cs-badge">NEW</div>
    `;
    newContainer.appendChild(newEl);
    
    // Show current equipment as clickable options
    currentContainer.innerHTML = '';
    let selectedIndex = -1;
    
    currentEquipment.forEach((equip, i) => {
      const el = document.createElement('div');
      el.className = 'consumable-select-item';
      el.dataset.index = i;
      const statStr = Object.entries(equip.effects).map(([k,v]) => `+${v} ${STAT_META[k].name}`).join(', ');
      el.innerHTML = `
        <span class="cs-emoji">${equip.emoji}</span>
        <div class="cs-details">
          <div class="cs-name">${equip.name}</div>
          <div class="cs-desc">${equip.desc}</div>
          <div class="cs-effect">${statStr}</div>
        </div>
      `;
      el.addEventListener('click', () => {
        currentContainer.querySelectorAll('.consumable-select-item').forEach(s => s.classList.remove('selected'));
        el.classList.add('selected');
        selectedIndex = i;
        keepBtn.disabled = false;
      });
      currentContainer.appendChild(el);
    });
    
    // Reset state
    keepBtn.disabled = true;
    selectedIndex = -1;
    
    // Skip (keep current)
    skipBtn.onclick = () => {
      Game.state.pendingEquipmentDrop = null;
      UI.showScreen('game');
      UI.nextEvent();
    };
    
    // Swap: replace selected equipment with new one
    keepBtn.onclick = () => {
      if (selectedIndex >= 0) {
        // Remove old equipment bonuses
        const oldEquip = Game.state.equipment[selectedIndex];
        SpecialSystem.removeEquipment(oldEquip.emoji, oldEquip.effects);
        
        // Replace with new equipment
        Game.state.equipment[selectedIndex] = { ...newEquipment };
        SpecialSystem.addEquipment(newEquipment.emoji, newEquipment.effects);
        Game.state.pendingEquipmentDrop = null;
        
        UI.showScreen('game');
        UI.renderEquipment();
        UI.nextEvent();
      }
    };
    
    UI.showScreen('equipment-choice');
  },
  
  // --- Popup Panel Methods ---
  
  openPopup(panelName) {
    // Close any currently open popup
    this.closePopup();
    
    const panel = document.getElementById(`panel-${panelName}`);
    if (!panel) return;
    
    // Render content based on panel type
    switch (panelName) {
      case 'special':
        this.renderPopupSpecial();
        break;
      case 'equipment':
        this.renderPopupEquipment();
        break;
      case 'log':
        this.renderPopupCareerLog();
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
    const statsContainer = document.getElementById('popup-special-stats');
    statsContainer.innerHTML = '';
    
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
      statsContainer.appendChild(bar);
    });
    
    document.getElementById('popup-player-level').textContent = Game.state.level;
    document.getElementById('popup-level-progress').textContent = this.progressText();
  },
  
  renderPopupEquipment() {
    const container = document.getElementById('popup-equipment-list');
    const equipment = Game.state.equipment;
    
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
        .map(([k, v]) => `+${v} ${STAT_META[k]?.name || k}`)
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
    const log = Game.state.careerLog.slice(0, 50);
    
    container.innerHTML = '';
    log.forEach((entry, i) => {
      const el = document.createElement('div');
      el.className = `log-entry ${i === 0 ? 'recent' : ''}`;
      const careerYear = Math.ceil(entry.day / 12);
      el.textContent = `Year ${careerYear}: ${entry.message}`;
      container.appendChild(el);
    });
  }
};
