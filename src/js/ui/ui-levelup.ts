// UI — level-up screens: stat allocation and the shared consumable pick-and-swap.
// Loaded before ui.js; its methods are composed into UI there.
import { STAT_META } from '../core/config.js';
import { STAT_KEYS } from '../data/archetypes.js';
import { CONSUMABLES } from '../data/items.js';
import { Game } from '../engine/game.js';
import { SpecialSystem } from '../engine/special.js';
import { setDisplay } from './ui-core.js';
import { UI } from './ui.js';
import { App } from '../app.js';
import type {Consumable} from '../core/types.js';


export const UILevelUp = {
  // Shared consumable pick-and-swap UI. Renders the new-consumable options
  // and, when the stash is at capacity, the current stash (click one to
  // replace it). Title and context are placeholders so each screen (level
  // up, Stock Up, victory) reuses the same selection UI with its own copy.
  renderConsumableSwap(cfg: {
    container: HTMLElement;
    titleEl?: HTMLElement | null;
    title?: string;
    contextEl?: HTMLElement | null;
    context?: string;
    options: Consumable[];
    current?: Consumable[];
    full?: boolean;
    continueBtn?: HTMLButtonElement;
    requireReplace?: boolean;
  }): () => { newId: string | null; replaceIndex: number } {
    if (cfg.titleEl && cfg.title) cfg.titleEl.textContent = cfg.title;
    if (cfg.contextEl && cfg.context) cfg.contextEl.innerHTML = cfg.context;

    const container = cfg.container;
    container.innerHTML = '';
    let newId: string | null = null;
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
        container.querySelectorAll('.consumable-select-item').forEach(s => s.classList.remove('selected'));
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
          container.querySelectorAll('[data-replace-index]').forEach(s => s.classList.remove('selected'));
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
  showLevelUpConsumableSelection(): void {
    const state = Game.state;
    if (!state) return;
    const options = state.pendingLevelUpConsumables;
    const hasFullInventory = state.consumables.length >= Game.consumableCap();

    // Show the level up screen first
    UI.showScreen('levelup');

    // Show consumables container
    setDisplay('levelup-consumables', 'block');
    setDisplay('levelup-stats-container', 'none');
    setDisplay('btn-skip-levelup', 'block');
    const continueBtn = document.getElementById('btn-continue-levelup') as HTMLButtonElement;
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
    const getSelection = UI.renderConsumableSwap({
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
  showLevelUpStats(): void {
    const state = Game.state;
    if (!state) return;
    UI.showScreen('levelup');

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
          (document.getElementById('btn-continue-levelup') as HTMLButtonElement).disabled = false;
        });
      }

      container.appendChild(stat);
    });

    const continueBtn = document.getElementById('btn-continue-levelup') as HTMLButtonElement;
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
};
