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

// UI Rendering
const UI = {
  currentScreen: 'title',
  
  // Audio context for sound effects
  /** @type {AudioContext | null} */
  audioCtx: null,
  
  // Initialize audio (must be called after user interaction)
  initAudio() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || (/** @type {any} */ (window)).webkitAudioContext)();
  },
  
  // Play a sound effect
  /** @param {string} type */
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
  /** @param {{ emoji?: string, name?: string, desc?: string, stat?: string, bonus?: number, multiplier?: number, effects?: Partial<Stats> }} item */
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
    } else if (item.effects) {
      effectText = formatEffects(item.effects);
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
      this.hideTooltip();
    });
    
    // Close tooltip when clicking outside
    document.addEventListener('click', (e) => {
      if (tooltip.style.display === 'none') return;
      const target = /** @type {Element} */ (e.target);
      if (tooltip.contains(target)) return;
      if (target.classList.contains('cons-info')) return;
      this.hideTooltip();
    });
    
    // Close popup when clicking close button or overlay
    document.addEventListener('click', (e) => {
      if ((/** @type {Element} */ (e.target)).classList.contains('popup-close')) {
        this.closePopup();
      }
      const activePopup = document.querySelector('.popup-panel.active');
      if (activePopup && e.target === activePopup) {
        this.closePopup();
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
    this.setHelpTab('info');
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
      this.currentScreen = screenId;
    }
  },
  
  // Render character creation screen
  renderCharacterCreation() {
    this._selectedPreset = null;
    const container = document.getElementById('stat-allocation');
    if (!container) return;
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
      const stats = zeroStats();
      STAT_KEYS.forEach(k => {
        const rows = container.querySelectorAll('.stat-row');
        for (const row of rows) {
          const labelEl = row.querySelector('.stat-label');
          const valueEl = row.querySelector('.stat-value');
          if (!labelEl || !valueEl) continue;
          if (labelEl.textContent === k) {
            stats[k] = parseInt(valueEl.textContent);
            break;
          }
        }
      });
      return stats;
    };
    
    // Bind events
    container.querySelectorAll('.stat-btn').forEach(/** @param {HTMLElement} btn */ (btn) => {
      btn.addEventListener('click', () => {
        const stat = btn.dataset.stat;
        const action = btn.dataset.action;
        const row = btn.closest('.stat-row');
        const valueEl = row ? row.querySelector('.stat-value') : null;
        if (!row || !valueEl) return;
        const cur = parseInt(valueEl.textContent);
        const stats = getStats();
        const total = STAT_KEYS.reduce((s, k) => s + stats[k], 0);
        
        if (action === 'plus' && cur < 10 && total < STARTING_POINTS) {
          valueEl.textContent = String(cur + 1);
          this._selectedPreset = null;
          this.updateCharCreationUI();
        } else if (action === 'minus' && cur > 1) {
          valueEl.textContent = String(cur - 1);
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
    if (!container || !toggle || !toggleText) return;
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
      if (dropdown && !dropdown.contains(/** @type {Node} */ (e.target))) {
        container.classList.remove('open');
        toggle.classList.remove('open');
      }
    };
    document.addEventListener('click', this._presetCloseHandler);
  },
  
  // Apply an archetype preset to the stat allocation
  /** @param {Stats} stats @param {Archetype | null} arch */
  applyArchetypePreset(stats, arch) {
    const container = document.getElementById('stat-allocation');
    if (!container) return;
    const rows = container.querySelectorAll('.stat-row');
    
    rows.forEach(row => {
      const labelEl = row.querySelector('.stat-label');
      const valueEl = row.querySelector('.stat-value');
      if (!labelEl || !valueEl) return;
      const minusBtn = /** @type {HTMLButtonElement} */ (row.querySelector('.stat-btn.minus'));
      const plusBtn = /** @type {HTMLButtonElement} */ (row.querySelector('.stat-btn.plus'));
      
      const value = stats[/** @type {StatKey} */ (labelEl.textContent)];
      valueEl.textContent = String(value);
      
      minusBtn.disabled = value <= 1;
      plusBtn.disabled = value >= 10;
    });
    
    const currentStats = zeroStats();
    rows.forEach(row => {
      const labelEl = row.querySelector('.stat-label');
      const valueEl = row.querySelector('.stat-value');
      if (!labelEl || !valueEl) return;
      currentStats[/** @type {StatKey} */ (labelEl.textContent)] = parseInt(valueEl.textContent);
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
    if (!toggleBtn || !content || !arrow) return;
    
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
    if (!container) return;
    const currentStats = zeroStats();
    
    const rows = container.querySelectorAll('.stat-row');
    rows.forEach(row => {
      const labelEl = row.querySelector('.stat-label');
      const valueEl = row.querySelector('.stat-value');
      if (!labelEl || !valueEl) return;
      currentStats[/** @type {StatKey} */ (labelEl.textContent)] = parseInt(valueEl.textContent);
    });
    
    const total = STAT_KEYS.reduce((sum, k) => sum + currentStats[k], 0);
    const remaining = STARTING_POINTS - total;
    const pointsEl = document.getElementById('points-remaining');
    if (pointsEl) pointsEl.textContent = String(remaining);
    
    const startBtn = /** @type {HTMLButtonElement} */ (document.getElementById('btn-start-career'));
    startBtn.disabled = remaining !== 0;
    
    // Update button disabled states
    rows.forEach(row => {
      const labelEl = row.querySelector('.stat-label');
      if (!labelEl) return;
      const minusBtn = /** @type {HTMLButtonElement} */ (row.querySelector('.stat-btn.minus'));
      const plusBtn = /** @type {HTMLButtonElement} */ (row.querySelector('.stat-btn.plus'));
      const value = currentStats[/** @type {StatKey} */ (labelEl.textContent)];
      
      minusBtn.disabled = value <= 1;
      plusBtn.disabled = value >= 10 || total >= STARTING_POINTS;
    });
    
    // Update archetype preview
    this.updateArchetypePreview(currentStats);
  },
  
  // Update archetype preview based on current stats
  /** @param {Stats} [currentStats] */
  updateArchetypePreview(currentStats) {
    if (!currentStats) {
      const container = document.getElementById('stat-allocation');
      if (!container) return;
      const stats = zeroStats();
      STAT_KEYS.forEach(k => {
        const rows = container.querySelectorAll('.stat-row');
        for (const row of rows) {
          const labelEl = row.querySelector('.stat-label');
          const valueEl = row.querySelector('.stat-value');
          if (!labelEl || !valueEl) continue;
          if (labelEl.textContent === k) {
            stats[k] = parseInt(valueEl.textContent);
            break;
          }
        }
      });
      currentStats = stats;
    }
    
    const preview = document.getElementById('archetype-preview');
    if (!preview) return;
    
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
    if (container) this.renderStatBars(container);
    this.renderPerks();
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
      const effectText = formatEffects(item.effects);
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
    const log = state.careerLog.slice(0, 20);
    
    container.innerHTML = '';
    log.forEach((entry, i) => {
      const el = document.createElement('div');
      el.className = `log-entry ${i === 0 ? 'recent' : ''}`;
      const careerYear = dayToCareerYear(entry.day);
      el.textContent = `Year ${careerYear}: ${entry.message}`;
      container.appendChild(el);
    });
    
    // Also update recent activity in main game area
    this.renderRecentActivity();
  },
  
  // Render recent activity (mobile-friendly)
  renderRecentActivity() {
    const container = document.getElementById('recent-log-entries');
    const state = Game.state;
    if (!container || !state) return;
    
    const recentEntries = state.careerLog.slice(0, 3);
    
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
    const progressText = this.progressText();
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
                  // Same competence gate as Game.resolveStatChecks — the d20
                  // roll is unknown at preview time, so show whether the
                  // effective stat clears the Luck-adjusted gate
                  const currentStat = SpecialSystem.effective(/** @type {StatKey} */ (stat));
                  const gate = (target - SpecialSystem.stats.L) * CONFIG.game.competenceGateFactor;
                  const success = currentStat >= gate;
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
    card.querySelectorAll('.cons-btn').forEach(/** @param {HTMLElement} btn */ (btn) => {
      const infoBtn = /** @type {HTMLElement | null} */ (btn.querySelector('.cons-info'));
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
          const id = /** @type {HTMLElement} */ (e.target).dataset.id;
          const consumable = CONSUMABLES.find(c => c.id === id);
          if (consumable) {
            this.showTooltip(consumable);
          }
        });
      }
      btn.addEventListener('click', (e) => {
        if (!(/** @type {Element} */ (e.target)).classList.contains('cons-info')) {
          const id = btn.dataset.id;
          if (id) this.useConsumable(id, event);
        }
      });
    });
    
    // Bind choice buttons
    card.querySelectorAll('.choice-btn').forEach(/** @param {HTMLElement} btn */ (btn) => {
      btn.addEventListener('click', () => {
        this.playSound('click');
        const choiceIndex = parseInt(btn.dataset.choice || '0', 10);
        this.handleChoice(event, choiceIndex);
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
      this.renderSpecialStats();
      
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
      
      this.renderEvent(event);
      this.insertConsumableFeedback(feedback, 3000);
      return;
    }
    
    // Handle normal bonus consumables
    if (result.stat === 'any') {
      STAT_KEYS.forEach(s => SpecialSystem.applyTempBonus(s, result.bonus));
    } else {
      SpecialSystem.applyTempBonus(result.stat, result.bonus);
    }
    
    this.renderSpecialStats();
    
    // Show feedback (inserted after the re-render — see insertConsumableFeedback)
    const feedback = document.createElement('div');
    feedback.className = 'consumable-feedback';
    const statName = result.stat === 'any' ? 'All Stats' : (STAT_META[result.stat]?.name || result.stat);
    feedback.innerHTML = `${result.emoji} ${result.name} used! +${result.bonus} ${statName}`;
    
    this.renderEvent(event);
    this.insertConsumableFeedback(feedback, 2000);
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
  
  // Handle a choice selection
  /** @param {GameEvent} event @param {number} choiceIndex */
  handleChoice(event, choiceIndex) {
    const result = Game.processChoice(event, choiceIndex);
    if (result.error) {
      console.error(result.error);
      return;
    }
    const state = Game.state;
    if (!state) return;
    
    // Update UI elements
    this.renderSpecialStats();
    this.renderEquipment();
    this.renderCareerLog();
    this.renderTopBar();
    
    // Show floating stat changes
    for (const [stat, value] of Object.entries(result.effects || {})) {
      if (value !== 0) {
        this.showStatFloat(stat, value);
      }
    }
    
    // Show toast notifications and play sounds for milestones.
    // Terminal states first: a run can END on a boss event (bossDefeated
    // is title-derived, gameOver is computed independently), and the level
    // cadence can fire on the same event — celebration toasts must not
    // clobber the death/retirement ones. Mirrors the continue-button chain.
    if (result.gameOver) {
      this.showToast('💀 Career Over', 'error');
      this.playSound('gameover');
      this.flashScreen('rgba(255, 0, 0, 0.4)');
    } else if (result.victory) {
      this.showToast('🏆 Retirement!', 'success');
      this.playSound('victory');
      this.flashScreen('rgba(255, 215, 0, 0.3)');
    } else if (result.leveledUp) {
      this.showToast(`📈 Level Up! Now level ${state.level}`, 'success');
      this.playSound('levelup');
    } else if (result.bossDefeated) {
      this.showToast('🏆 Boss Defeated!', 'success');
      this.playSound('boss');
      this.flashScreen('rgba(0, 255, 136, 0.3)');
    } else if (result.itemDropped) {
      this.showToast(`🎁 Found: ${result.itemDropped.emoji} ${result.itemDropped.name}`, 'success');
      this.playSound('success');
    } else {
      // Regular choice sound
      this.playSound(result.success ? 'success' : 'failure');
    }
    
    this.renderResult(result);
  },
  
  // Render the event result screen. Called after processChoice, and again
  // after perk prompts resolve so the updated state is shown.
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
      this.showToast(`⚡ Clean Deploy: ${result.success ? 'SUCCESS' : 'FAILURE'}`, result.success ? 'success' : 'error');
      this.playSound('perk');
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
      this.renderEquipment();
    }
    
    // Show check results
    if (result.checkResults && result.checkResults.length > 0) {
      const checkHTML = result.checkResults.map(cr => 
        `<span class="stat-change ${cr.success ? 'positive' : 'negative'}">${cr.stat}: rolled ${cr.roll} vs ${cr.target} ${cr.success ? (cr.negotiated ? '🤝' : '✓') : '✗'}</span>`
      ).join('');
      resultHTML += `<div class="stat-changes">${checkHTML}</div>`;
    }
    
    // Perk intervention prompts — styled boxes (like item drops), one per
    // available active perk
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
    
    let perkPromptsHTML = '';
    if (result.hasNegotiate) perkPromptsHTML += perkPromptBox('negotiate', 'btn-negotiate-yes', 'btn-negotiate-no', '🤝 Use Negotiate');
    if (result.hasBruteForce) perkPromptsHTML += perkPromptBox('brute_force', 'btn-bruteforce-yes', 'btn-bruteforce-no', '💪 Use Brute Force');
    if (result.hasCodeReview) perkPromptsHTML += perkPromptBox('code_review', 'btn-codereview-yes', 'btn-codereview-no', '🐛 Use Code Review');
    
    // Continue button
    let continueText = 'Continue →';
    if (result.gameOver) continueText = 'View Results →';
    else if (result.victory) continueText = 'View Retirement →';
    else if (result.leveledUp) continueText = 'Level Up →';
    else if (result.phaseComplete) continueText = 'Continue →';
    else if (result.bossDefeated) continueText = 'Boss Defeated — Continue →';
    
    resultHTML += perkPromptsHTML;
    resultHTML += `<div class="result-actions"><button class="btn btn-primary btn-continue" id="btn-continue-event">${continueText}</button></div>`;
    
    resultDiv.innerHTML = resultHTML;
    body.appendChild(resultDiv);
    
    // Bind perk prompt buttons — unified pattern:
    //   Use     → apply perk, toast the outcome, re-render result
    //   Decline → re-render result (other prompts stay available)
    /** @param {string} yesId @param {string} noId @param {'hasNegotiate' | 'hasBruteForce' | 'hasCodeReview'} flag @param {() => boolean} useFn @param {string} perkName @param {string} emoji @param {() => boolean} getOutcome */
    const bindPerkPrompt = (yesId, noId, flag, useFn, perkName, emoji, getOutcome) => {
      const yes = document.getElementById(yesId);
      const no = document.getElementById(noId);
      if (yes) {
        yes.addEventListener('click', () => {
          if (useFn()) {
            result[flag] = false;
            const outcome = getOutcome();
            this.showToast(`⚡ ${perkName}: ${outcome ? 'SUCCESS' : 'FAILURE'}`, outcome ? 'success' : 'error');
            this.playSound('perk');
            this.renderResult(result);
          }
        });
      }
      if (no) {
        no.addEventListener('click', () => {
          result[flag] = false;
          this.renderResult(result);
        });
      }
    };
    
    bindPerkPrompt('btn-negotiate-yes', 'btn-negotiate-no', 'hasNegotiate', () => Game.useNegotiate(result), 'Negotiate', '🤝', () => true);
    bindPerkPrompt('btn-bruteforce-yes', 'btn-bruteforce-no', 'hasBruteForce', () => Game.useBruteForce(result), 'Brute Force', '💪', () => (result.checkResults || []).some(cr => cr.stat === 'S' && cr.success));
    bindPerkPrompt('btn-codereview-yes', 'btn-codereview-no', 'hasCodeReview', () => Game.useCodeReview(result), 'Code Review', '🐛', () => true);
    
    // Bind continue button
    const continueBtn = document.getElementById('btn-continue-event');
    if (continueBtn) continueBtn.addEventListener('click', () => {
      if (showEquipmentChoice) {
        const pending = state.pendingEquipmentDrop;
        if (pending) UI.showEquipmentChoice(pending, [...state.equipment]);
      } else if (result.gameOver) {
        this.showGameOver(result.gameOver.reason);
      } else if (result.victory) {
        this.showVictory();
      } else if (result.leveledUp) {
        this.showLevelUpStats();
      } else {
        // Plain continue, or phase complete: nextEvent() owns phase
        // advancement (bossCompleted → advancePhase → recurse)
        this.nextEvent();
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
    
    const excludeIds = Game.state.eventHistory || [];
    let event;
    
    // If boss already defeated, advance to next phase. nextEvent is the
    // single owner of phase advancement — the result screen's continue
    // button relies on this instead of calling advancePhase itself.
    if (Game.state.bossCompleted) {
      Game.advancePhase();
      this.renderTopBar();
      this.renderCareerLog(); // show the promotion entry in the side panel
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
      this.renderCareerLog();
      this.nextEvent();
      return;
    }
    
    this.renderEvent(event);
  },
  
  /** Shared consumable pick-and-swap UI. Renders the new-consumable options
   * and, when the stash is at capacity, the current stash (click one to
   * replace it). Title and context are placeholders so each screen (level
   * up, Stock Up, victory) reuses the same selection UI with its own copy.
   * @param {Object} cfg
   * @param {HTMLElement} cfg.container element to render options/stash into
   * @param {HTMLElement | null} [cfg.titleEl] screen title placeholder
   * @param {string} [cfg.title] e.g. '☕ Stock Up!'
   * @param {HTMLElement | null} [cfg.contextEl] screen context-line placeholder
   * @param {string} [cfg.context] e.g. 'Pick 1 consumable to carry into your next career.'
   * @param {Consumable[]} cfg.options new consumables to pick from
   * @param {Consumable[]} [cfg.current] current stash (swap targets)
   * @param {boolean} [cfg.full] stash is at capacity
   * @param {HTMLButtonElement} [cfg.continueBtn] enabled once a valid selection is made
   * @param {boolean} [cfg.requireReplace] when full, a swap target must also be picked
   * @returns {() => {newId: string | null, replaceIndex: number}} selection getter
   */
  renderConsumableSwap(cfg) {
    if (cfg.titleEl && cfg.title) cfg.titleEl.textContent = cfg.title;
    if (cfg.contextEl && cfg.context) cfg.contextEl.innerHTML = cfg.context;
    
    const container = cfg.container;
    container.innerHTML = '';
    /** @type {string | null} */
    let newId = null;
    let replaceIndex = -1;
    
    const updateButton = () => {
      if (!cfg.continueBtn) return;
      const needsReplace = cfg.full && cfg.requireReplace;
      cfg.continueBtn.disabled = !(newId !== null && (!needsReplace || replaceIndex >= 0));
    };
    
    // Show new consumable options
    const optionsLabel = document.createElement('div');
    optionsLabel.className = 'consumable-selection-label';
    optionsLabel.textContent = cfg.full ? 'Choose a new consumable:' : 'Choose a consumable:';
    optionsLabel.style.cssText = 'font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-green); margin-bottom: var(--spacing-sm); text-transform: uppercase;';
    container.appendChild(optionsLabel);
    
    cfg.options.forEach((newConsumable) => {
      const itemElement = UI.renderConsumableItem(newConsumable, { id: newConsumable.id });
      itemElement.addEventListener('click', () => {
        container.querySelectorAll('.consumable-select-item').forEach(/** @param {Element} s */ (s) => s.classList.remove('selected'));
        itemElement.classList.add('selected');
        newId = newConsumable.id;
        updateButton();
      });
      container.appendChild(itemElement);
    });
    
    // If the stash is full, show current consumables for swapping
    if (cfg.full && cfg.current && cfg.current.length > 0) {
      const currentLabel = document.createElement('div');
      currentLabel.className = 'consumable-selection-label';
      currentLabel.textContent = 'Your current stash (click to replace):';
      currentLabel.style.cssText = 'font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-yellow); margin-top: var(--spacing-lg); margin-bottom: var(--spacing-sm); text-transform: uppercase;';
      container.appendChild(currentLabel);
      
      cfg.current.forEach((currentConsumable, inventoryIndex) => {
        const itemElement = UI.renderConsumableItem(currentConsumable, { replaceIndex: inventoryIndex });
        itemElement.addEventListener('click', () => {
          container.querySelectorAll('[data-replace-index]').forEach(/** @param {Element} s */ (s) => s.classList.remove('selected'));
          itemElement.classList.add('selected');
          replaceIndex = inventoryIndex;
          updateButton();
        });
        container.appendChild(itemElement);
      });
    }
    
    updateButton();
    return () => ({ newId, replaceIndex });
  },
  
  // Show consumable selection screen after level up
  showLevelUpConsumableSelection() {
    const state = Game.state;
    if (!state) return;
    const options = state.pendingLevelUpConsumables;
    const hasFullInventory = state.consumables.length >= 2;
    
    // Show the level up screen first
    this.showScreen('levelup');
    
    // Show consumables container
    setDisplay('levelup-consumables', 'block');
    setDisplay('levelup-stats-container', 'none');
    setDisplay('btn-skip-levelup', 'block');
    const continueBtn = /** @type {HTMLButtonElement} */ (document.getElementById('btn-continue-levelup'));
    continueBtn.style.display = 'block';
    continueBtn.disabled = true;
    
    // Shared pick-and-swap UI with level-up title/context
    const descNote = '<span style="font-size: 0.8rem; color: var(--text-muted);">(Consumables are one-time use for a single event — use them wisely!)</span>';
    const context = hasFullInventory
      ? `You've reached Level <span id="new-level">${state.level}</span>. Pick a consumable and choose which to replace. ${descNote}`
      : `You've reached Level <span id="new-level">${state.level}</span>. Pick a consumable to add to your stash. ${descNote}`;
    const container = document.getElementById('levelup-consumables');
    const titleEl = document.getElementById('levelup-title');
    const contextEl = document.getElementById('levelup-desc');
    if (!container) return;
    const getSelection = this.renderConsumableSwap({
      container,
      titleEl,
      title: '🎉 Level Up!',
      contextEl,
      context,
      options: options || [],
      current: state.consumables,
      full: hasFullInventory,
      continueBtn,
      // Level-up keeps its historical behavior: a new pick without a chosen
      // replacement is discarded, so Continue only needs the new pick
      requireReplace: false
    });
    
    // Bind skip button — skip consumable, finish level up
    const skipBtn = document.getElementById('btn-skip-levelup');
    if (skipBtn) skipBtn.onclick = () => {
      state.pendingLevelUpConsumables = null;
      App.afterLevelUp();
    };
    
    // Bind continue button
    continueBtn.onclick = () => {
      const { newId, replaceIndex } = getSelection();
      if (!newId) return;
      
      const consumable = CONSUMABLES.find(c => c.id === newId);
      if (!consumable) return;
      
      // Handle the consumable selection
      if (hasFullInventory) {
        // Inventory full — must replace a selected consumable
        if (replaceIndex >= 0) {
          state.consumables[replaceIndex] = { ...consumable };
        }
        // If replaceIndex is -1, don't add anything (user didn't pick what to replace)
      } else {
        // Add to inventory
        state.consumables.push({ ...consumable });
      }
      
      // Clear pending consumables
      state.pendingLevelUpConsumables = null;
      
      // Finish level up
      App.afterLevelUp();
    };
  },
  
  // Show stat selection screen
  showLevelUpStats() {
    const state = Game.state;
    if (!state) return;
    this.showScreen('levelup');
    
    // Update description (stat selection phase)
    const descEl = document.getElementById('levelup-desc');
    if (descEl) descEl.innerHTML = `You've reached Level <span id="new-level">${state.level}</span>. Choose a stat to increase.`;
    
    // Show remaining points (🧠 Rapid Learner can grant 2+)
    const pointsEl = document.getElementById('levelup-points');
    const points = state.levelUpPoints || 1;
    if (pointsEl) {
      pointsEl.textContent = points > 1 ? `You have ${points} points to spend — choose one at a time.` : '';
      pointsEl.style.display = points > 1 ? 'block' : 'none';
    }
    
    setDisplay('levelup-consumables', 'none');
    setDisplay('levelup-stats-container', 'block');
    setDisplay('btn-skip-levelup', 'none');
    setDisplay('btn-continue-levelup', 'block');
    
    const container = document.getElementById('levelup-stats');
    if (!container) return;
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
/** @type {HTMLButtonElement} */ (document.getElementById('btn-continue-levelup')).disabled = false;
        });
      }
      
      container.appendChild(stat);
    });
    
const continueBtn = /** @type {HTMLButtonElement} */ (document.getElementById('btn-continue-levelup'));
    if (continueBtn) continueBtn.disabled = true;
    
    // Bind continue button — spend points one at a time; consumables come
    // after the last point is spent, otherwise continue straight away.
    if (continueBtn) continueBtn.onclick = () => {
      const state = Game.state;
      if (!state) return;
      if ((state.levelUpPoints || 1) > 1) {
        App.afterLevelUp();
      } else if (state.pendingLevelUpConsumables && state.pendingLevelUpConsumables.length > 0) {
        UI.showLevelUpConsumableSelection();
      } else {
        App.afterLevelUp();
      }
    };
  },
  
  // Show game over screen
  /** @param {string} reason */
  showGameOver(reason) {
    Game.saveRunComplete();
    
    // Show consumable selection first
    this.showConsumableSelection('gameover');
    setText('gameover-reason', reason);
  },
  
  // Show consumable selection at end of run — the shared pick-and-swap UI
  // ("Stock Up") with per-screen title/context placeholders
  /** @param {string} type */
  showConsumableSelection(type) {
    const options = ConsumableManager.getEndOfRunOptions();
    // The carried stash: what the player already carries across runs. When
    // it's full, the swap section lets them replace one of the carried items
    const carried = MetaStore.carriedIds('startingConsumables')
      .map(/** @param {string} id */ (id) => CONSUMABLES.find(c => c.id === id))
      .filter(/** @returns {item is Consumable} */ (item) => Boolean(item));
    const full = carried.length >= 2;
    
    /** @param {string} title @param {string} context @param {HTMLElement} container @param {HTMLElement | null} titleEl @param {HTMLElement | null} contextEl @param {HTMLButtonElement} continueBtn @param {(id: string, replaceIndex: number) => void} onPick */
    const render = (title, context, container, titleEl, contextEl, continueBtn, onPick) => {
      const getSelection = this.renderConsumableSwap({
        container, titleEl, contextEl, title, context,
        options, current: carried, full,
        continueBtn, requireReplace: true
      });
      continueBtn.onclick = () => {
        const { newId, replaceIndex } = getSelection();
        if (newId) onPick(newId, replaceIndex);
      };
    };
    
    if (type === 'gameover') {
      // Game over screen
      const container = document.getElementById('gameover-cons-selection');
      const continueBtn = /** @type {HTMLButtonElement} */ (document.getElementById('btn-continue-gameover-cons'));
      if (!container || !continueBtn) return;
      render(
        '☕ Stock Up!',
        'Pick 1 consumable to carry into your next career.',
        container,
        document.getElementById('gameover-cons-title'),
        document.getElementById('gameover-cons-desc'),
        continueBtn,
        (id, replaceIndex) => this.applyEndOfRunConsumable(id, replaceIndex)
      );
      // Skip: keep the carried stash as-is
      const skipBtn = document.getElementById('btn-skip-gameover-cons');
      if (skipBtn) skipBtn.onclick = () => {
        this.applyEndOfRunConsumable(null);
      };
      this.showScreen('gameover-cons');
    } else {
      // Victory screen
      const consContainer = document.getElementById('victory-consumables');
      const summaryContainer = document.getElementById('victory-summary');
      const continueBtn = /** @type {HTMLButtonElement} */ (document.getElementById('btn-continue-victory-cons'));
      const buttonsContainer = document.getElementById('victory-buttons');
      if (!consContainer || !summaryContainer || !continueBtn || !buttonsContainer) return;
      
      consContainer.style.display = 'block';
      summaryContainer.style.display = 'none';
      setDisplay('victory-cons-buttons', 'flex');
      continueBtn.disabled = true;
      buttonsContainer.style.display = 'none';
      
      render(
        '🏆 Retirement!',
        'You\'ve completed your career. Pick 1 consumable to carry into your next career.',
        consContainer,
        document.getElementById('victory-title'),
        document.getElementById('victory-desc'),
        continueBtn,
        (id, replaceIndex) => this.applyVictoryConsumable(id, replaceIndex)
      );
      // Skip: keep the carried stash as-is
      const skipBtn = document.getElementById('btn-skip-victory-cons');
      if (skipBtn) skipBtn.onclick = () => {
        this.applyVictoryConsumable(null);
      };
      this.showScreen('victory');
    }
  },
  
  // Apply selected consumable and show game over. selectedId = null means
  // the player skipped — the carried stash stays as-is
  /** @param {string | null} selectedId @param {number} [replaceIndex] carried slot to swap, or -1 */
  applyEndOfRunConsumable(selectedId, replaceIndex) {
    // Carry this consumable into future runs (store ID only)
    if (selectedId) MetaStore.addCarriedConsumable(selectedId, replaceIndex);
    
    // Show game over summary
    SaveSystem.deleteSave();
    this.showScreen('gameover');
    
    const summary = Game.getSummary();
    const container = document.getElementById('gameover-summary');
    if (!summary || !container) return;
    container.innerHTML = `
      <div class="summary-row"><span class="label">Run #</span><span class="value">${summary.runNumber}</span></div>
      <div class="summary-row"><span class="label">Level Reached</span><span class="value">${summary.level}</span></div>
      <div class="summary-row"><span class="label">Final Position</span><span class="value">${CONFIG.game.phaseNames[summary.phase] || summary.phase}</span></div>
      <div class="summary-row"><span class="label">Career Length</span><span class="value">${(summary.day / CONFIG.game.daysPerCareerYear).toFixed(1)} years</span></div>
      <div class="summary-row"><span class="label">Events Completed</span><span class="value">${summary.eventsCompleted}</span></div>
      <div class="summary-row"><span class="label">Equipment</span><span class="value">${summary.equipment.length}</span></div>
      <div class="summary-row"><span class="label">Stats</span><span class="value">${STAT_KEYS.map(k => `${k}:${SpecialSystem.stats[k]}`).join(' ')}</span></div>
    `;
  },
  
  // Apply selected consumable and show victory summary. selectedId = null
  // means the player skipped — the carried stash stays as-is
  /** @param {string | null} selectedId @param {number} [replaceIndex] carried slot to swap, or -1 */
  applyVictoryConsumable(selectedId, replaceIndex) {
    // Carry this consumable into future runs (store ID only)
    if (selectedId) MetaStore.addCarriedConsumable(selectedId, replaceIndex);
    
    // Hide consumable selection, show summary
    setDisplay('victory-consumables', 'none');
    setDisplay('victory-cons-buttons', 'none');
    // Restore the retirement context line (the pick screen overwrote it)
    setText('victory-desc', "You've completed your career. Time to enjoy the beach (with WiFi).");
    const summaryContainer = document.getElementById('victory-summary');
    if (!summaryContainer) return;
    summaryContainer.style.display = 'block';
    setDisplay('victory-buttons', 'flex');
    
    SaveSystem.deleteSave();
    
    const summary = Game.getSummary();
    if (!summary) return;
    summaryContainer.innerHTML = `
      <div class="summary-row"><span class="label">Run #</span><span class="value">${summary.runNumber}</span></div>
      <div class="summary-row"><span class="label">Final Level</span><span class="value">${summary.level}</span></div>
      <div class="summary-row"><span class="label">Final Position</span><span class="value">${CONFIG.game.phaseNames[summary.phase] || summary.phase} 🏆</span></div>
      <div class="summary-row"><span class="label">Career Length</span><span class="value">${(summary.day / CONFIG.game.daysPerCareerYear).toFixed(1)} years</span></div>
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
  /** @param {boolean} open */
  togglePanel(open) {
    const panel = document.getElementById('side-panel');
    const overlay = document.getElementById('panel-overlay');
    if (!panel || !overlay) return;
    
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
  /** @param {Equipment} newEquipment @param {Equipment[]} currentEquipment */
  showEquipmentChoice(newEquipment, currentEquipment) {
    const newContainer = document.getElementById('equipment-choice-new');
    const currentContainer = document.getElementById('equipment-choice-current');
    const keepBtn = /** @type {HTMLButtonElement} */ (document.getElementById('btn-keep-equipment'));
    const skipBtn = document.getElementById('btn-skip-equipment');
    if (!newContainer || !currentContainer || !keepBtn) return;
    
    // Show new equipment
    newContainer.innerHTML = '';
    const newEl = document.createElement('div');
    newEl.className = 'consumable-select-item';
    newEl.style.borderColor = 'var(--accent-green)';
    const statStr = formatEffects(newEquipment.effects);
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
      el.dataset.index = String(i);
      const statStr = formatEffects(equip.effects);
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
    if (skipBtn) skipBtn.onclick = () => {
      const state = Game.state;
      if (!state) return;
      state.pendingEquipmentDrop = null;
      UI.showScreen('game');
      UI.nextEvent();
    };
    
    // Swap: replace selected equipment with new one
    keepBtn.onclick = () => {
      const state = Game.state;
      if (!state) return;
      if (selectedIndex >= 0) {
        // Remove old equipment bonuses
        const oldEquip = state.equipment[selectedIndex];
        SpecialSystem.removeEquipment(oldEquip.emoji, oldEquip.effects);
        
        // Replace with new equipment
        state.equipment[selectedIndex] = { ...newEquipment };
        SpecialSystem.addEquipment(newEquipment.emoji, newEquipment.effects);
        state.pendingEquipmentDrop = null;
        
        UI.showScreen('game');
        UI.renderEquipment();
        UI.nextEvent();
      }
    };
    
    UI.showScreen('equipment-choice');
  },
  
  // --- Popup Panel Methods ---
  
  /** @param {string} panelName */
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
    const state = Game.state;
    if (!state) return;
    const bars = document.getElementById('popup-special-stats');
    if (bars) this.renderStatBars(bars);
    
    setText('popup-player-level', String(state.level));
    setText('popup-level-progress', this.progressText());
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
    const log = state.careerLog.slice(0, 50);
    
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
