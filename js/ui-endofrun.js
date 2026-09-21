// UI — end-of-run screens: game over, victory, Stock Up, equipment choice.
// Loaded before ui.js; its methods are composed into UI there.
const UIEndOfRun = {
  // Show game over screen
  /** @param {string} reason */
  showGameOver(reason) {
    Game.saveRunComplete();
    
    // Show consumable selection first
    UI.showConsumableSelection('gameover');
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
    const full = carried.length >= Game.consumableCap();
    
    /** @param {string} title @param {string} context @param {HTMLElement} container @param {HTMLElement | null} titleEl @param {HTMLElement | null} contextEl @param {HTMLButtonElement} continueBtn @param {(id: string, replaceIndex: number) => void} onPick */
    const render = (title, context, container, titleEl, contextEl, continueBtn, onPick) => {
      const getSelection = UI.renderConsumableSwap({
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
        (id, replaceIndex) => UI.applyEndOfRunConsumable(id, replaceIndex)
      );
      // Skip: keep the carried stash as-is
      const skipBtn = document.getElementById('btn-skip-gameover-cons');
      if (skipBtn) skipBtn.onclick = () => {
        UI.applyEndOfRunConsumable(null);
      };
      UI.showScreen('gameover-cons');
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
        (id, replaceIndex) => UI.applyVictoryConsumable(id, replaceIndex)
      );
      // Skip: keep the carried stash as-is
      const skipBtn = document.getElementById('btn-skip-victory-cons');
      if (skipBtn) skipBtn.onclick = () => {
        UI.applyVictoryConsumable(null);
      };
      UI.showScreen('victory');
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
    UI.showScreen('gameover');
    
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
    UI.showConsumableSelection('victory');
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
    UI.togglePanel(false);
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
    const statStr = equipmentEffectText(newEquipment);
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
      const statStr = equipmentEffectText(equip);
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
};
