// UI Rendering
const UI = {
  currentScreen: 'title',
  _presetToggleHandler: null,
  _presetCloseHandler: null,
  _descToggleHandler: null,
  
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
          this.updateCharCreationUI();
        } else if (action === 'minus' && cur > 1) {
          valueEl.textContent = cur - 1;
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
    
    // Only the top 5 are unlocked by default
    const UNLOCKED_KEYS = ['architect', 'startup', 'systems', 'advocate', 'balanced'];
    
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
          this.applyArchetypePreset(arch.stats);
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
  applyArchetypePreset(stats) {
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
    
    // Determine archetype based on top 2 stats
    const sorted = STAT_KEYS.sort((a, b) => currentStats[b] - currentStats[a]);
    const top1 = sorted[0];
    const top2 = sorted[1];
    
    let archetype = null;
    
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
    
    preview.innerHTML = `
      <div class="archetype-name">${archetype.name}</div>
      <div class="archetype-desc">${archetype.description}</div>
    `;
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
      const el = document.createElement('span');
      el.className = 'equip-item';
      el.setAttribute('tabindex', '0');
      el.innerHTML = `${item.emoji}<span class="tooltip">${item.name}: ${Object.entries(item.effects).map(([k,v]) => `+${v} ${STAT_META[k].name}`).join(', ')}</span>`;
      container.appendChild(el);
    });
  },
  
  // Render consumables
  renderConsumables() {
    const container = document.getElementById('consumables-list');
    const consumables = Game.state.consumables;
    
    if (consumables.length === 0) {
      container.innerHTML = '<span class="empty-text">No consumables</span>';
      return;
    }
    
    // Group by ID
    const grouped = {};
    consumables.forEach(c => {
      if (!grouped[c.id]) {
        grouped[c.id] = { ...c, count: 0 };
      }
      grouped[c.id].count++;
    });
    
    container.innerHTML = '';
    Object.values(grouped).forEach(item => {
      const el = document.createElement('div');
      el.className = 'consumable-item';
      el.innerHTML = `
        <span class="cons-emoji">${item.emoji}</span>
        <span class="cons-name">${item.name}</span>
        <span class="cons-count">×${item.count}</span>
      `;
      el.setAttribute('data-id', item.id);
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
      el.textContent = `Day ${entry.day}: ${entry.message}`;
      container.appendChild(el);
    });
  },
  
  // Render top bar
  renderTopBar() {
    const phaseNames = ['', 'Junior Developer', 'Mid-Level Developer', 'Senior Developer', 'Staff/Principal'];
    document.getElementById('career-phase').textContent = phaseNames[Game.state.phase];
    document.getElementById('career-day').textContent = `Day ${Game.state.day}`;
    document.getElementById('player-level').textContent = Game.state.level;
    document.getElementById('level-up-points').textContent = Game.state.levelUpPoints;
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
          ${event.choices.map((choice, i) => `
            <button class="choice-btn" data-choice="${i}">
              <span class="choice-letter">${letters[i]}.</span> ${choice.text}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    
    container.innerHTML = '';
    container.appendChild(card);
    
    // Bind consumable buttons
    card.querySelectorAll('.cons-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.useConsumable(btn.dataset.id, event);
      });
    });
    
    // Bind choice buttons
    card.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
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
      
      this.renderConsumables();
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
    
    this.renderConsumables();
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
    this.renderTopBar();
    
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
    if (result.itemDropped) {
      resultHTML += `<div class="item-drop">🎁 Found: ${result.itemDropped.emoji} ${result.itemDropped.name}</div>`;
    }
    
    // Handle consumable drop
    if (result.consumableDropped) {
      if (Game.state.consumables.length >= 2) {
        // Inventory full — show choice screen instead of auto-adding
        resultHTML += `<div class="item-drop">🧪 Found: ${result.consumableDropped.emoji} ${result.consumableDropped.name} — inventory full!</div>`;
        
        // Override continue button to show consumable choice
        document.getElementById('btn-continue-event').addEventListener('click', () => {
          UI.showConsumableChoice(result.consumableDropped, [...Game.state.consumables]);
        });
      } else {
        // Inventory has room — add it automatically
        Game.state.consumables.push({ ...result.consumableDropped });
        resultHTML += `<div class="item-drop">🧪 Found: ${result.consumableDropped.emoji} ${result.consumableDropped.name}</div>`;
        this.renderConsumables();
      }
    }
    
    // Show check results
    if (result.checkResults && result.checkResults.length > 0) {
      const checkHTML = result.checkResults.map(cr => 
        `<span class="stat-change ${cr.success ? 'positive' : 'negative'}">${cr.stat}: rolled ${cr.roll} vs ${cr.target} ${cr.success ? '✓' : '✗'}</span>`
      ).join('');
      resultHTML += `<div class="stat-changes">${checkHTML}</div>`;
    }
    
    // Continue button
    let continueText = 'Continue →';
    if (result.gameOver) continueText = 'View Results →';
    else if (result.victory) continueText = 'View Retirement →';
    else if (result.leveledUp) continueText = 'Level Up →';
    else if (result.phaseComplete) continueText = 'Continue →';
    
    resultHTML += `<button class="btn btn-primary btn-continue" id="btn-continue-event">${continueText}</button>`;
    
    resultDiv.innerHTML = resultHTML;
    body.appendChild(resultDiv);
    
    // Bind continue button
    document.getElementById('btn-continue-event').addEventListener('click', () => {
      if (result.gameOver) {
        this.showGameOver(result.reason);
      } else if (result.victory) {
        this.showVictory();
      } else if (result.leveledUp) {
        this.showLevelUp();
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
    const event = getRandomEvent(Game.state.phase, excludeIds);
    
    if (!event) {
      console.log('[DevLife] No event found for phase', Game.state.phase, 'excluded:', excludeIds);
      Game.advancePhase();
      this.renderTopBar();
      this.nextEvent();
      return;
    }
    
    console.log('[DevLife] Rendering event:', event.title);
    this.renderEvent(event);
  },
  
  // Show level up screen
  showLevelUp() {
    this.showScreen('levelup');
    document.getElementById('new-level').textContent = Game.state.level;
    
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
      container.innerHTML = '';
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
          document.getElementById('btn-continue-gameover-cons').disabled = false;
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
    // Add to meta for next run
    const meta = JSON.parse(localStorage.getItem('devlife_meta') || '{}');
    if (!meta.startingConsumables) meta.startingConsumables = [];
    
    const consumable = CONSUMABLES.find(c => c.id === selectedId);
    if (consumable) {
      meta.startingConsumables.push(consumable);
      localStorage.setItem('devlife_meta', JSON.stringify(meta));
    }
    
    // Show game over summary
    Game.clearSave();
    this.showScreen('gameover');
    
    const summary = Game.getSummary();
    const container = document.getElementById('gameover-summary');
    container.innerHTML = `
      <div class="summary-row"><span class="label">Run #</span><span class="value">${summary.runNumber}</span></div>
      <div class="summary-row"><span class="label">Level Reached</span><span class="value">${summary.level}</span></div>
      <div class="summary-row"><span class="label">Career Phase</span><span class="value">${summary.phase}/4</span></div>
      <div class="summary-row"><span class="label">Days Survived</span><span class="value">${summary.day}</span></div>
      <div class="summary-row"><span class="label">Events Completed</span><span class="value">${summary.eventsCompleted}</span></div>
      <div class="summary-row"><span class="label">Equipment</span><span class="value">${summary.equipment.length}</span></div>
      <div class="summary-row"><span class="label">Stats</span><span class="value">${STAT_KEYS.map(k => `${k}:${SpecialSystem.stats[k]}`).join(' ')}</span></div>
    `;
  },
  
  // Apply selected consumable and show victory summary
  applyVictoryConsumable(selectedId) {
    // Add to meta for next run
    const meta = JSON.parse(localStorage.getItem('devlife_meta') || '{}');
    if (!meta.startingConsumables) meta.startingConsumables = [];
    
    const consumable = CONSUMABLES.find(c => c.id === selectedId);
    if (consumable) {
      meta.startingConsumables.push(consumable);
      localStorage.setItem('devlife_meta', JSON.stringify(meta));
    }
    
    // Hide consumable selection, show summary
    document.getElementById('victory-consumables').style.display = 'none';
    document.getElementById('btn-continue-victory-cons').style.display = 'none';
    const summaryContainer = document.getElementById('victory-summary');
    summaryContainer.style.display = 'block';
    document.getElementById('victory-buttons').style.display = 'flex';
    
    Game.clearSave();
    
    const summary = Game.getSummary();
    summaryContainer.innerHTML = `
      <div class="summary-row"><span class="label">Run #</span><span class="value">${summary.runNumber}</span></div>
      <div class="summary-row"><span class="label">Final Level</span><span class="value">${summary.level}</span></div>
      <div class="summary-row"><span class="label">Career Phase</span><span class="value">${summary.phase}/4 🏆</span></div>
      <div class="summary-row"><span class="label">Days in Career</span><span class="value">${summary.day}</span></div>
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
  
  // Show consumable choice screen (when inventory is full)
  showConsumableChoice(newConsumable, currentConsumables) {
    const newContainer = document.getElementById('consumable-choice-new');
    const currentContainer = document.getElementById('consumable-choice-current');
    const keepBtn = document.getElementById('btn-keep-consumable');
    const declineBtn = document.getElementById('btn-decline-consumable');
    
    // Show new consumable
    newContainer.innerHTML = '';
    const newEl = document.createElement('div');
    newEl.className = 'consumable-select-item';
    newEl.style.borderColor = 'var(--accent-green)';
    newEl.innerHTML = `
      <span class="cs-emoji" style="font-size: 2em;">${newConsumable.emoji}</span>
      <div class="cs-details">
        <div class="cs-name">${newConsumable.name}</div>
        <div class="cs-desc">${newConsumable.desc}</div>
      </div>
      <div class="cs-badge">NEW</div>
    `;
    newContainer.appendChild(newEl);
    
    // Show current consumables as clickable options
    currentContainer.innerHTML = '';
    let selectedIndex = -1;
    
    currentConsumables.forEach((cons, i) => {
      const el = document.createElement('div');
      el.className = 'consumable-select-item';
      el.dataset.index = i;
      el.innerHTML = `
        <span class="cs-emoji">${cons.emoji}</span>
        <div class="cs-details">
          <div class="cs-name">${cons.name}</div>
          <div class="cs-desc">${cons.desc}</div>
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
    
    // Keep current (decline new)
    declineBtn.onclick = () => {
      UI.showScreen('game');
      UI.nextEvent();
    };
    
    // Swap: replace selected consumable with new one
    keepBtn.onclick = () => {
      if (selectedIndex >= 0) {
        Game.state.consumables[selectedIndex] = { ...newConsumable };
        UI.showScreen('game');
        UI.renderConsumables();
        UI.nextEvent();
      }
    };
    
    UI.showScreen('consumable-choice');
  }
};
