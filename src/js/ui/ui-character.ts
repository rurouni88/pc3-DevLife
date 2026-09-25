// UI — character creation screen: presets, stat allocation, archetype preview.
// Loaded before ui.js; its methods are composed into UI there.

// Render a single stat allocation row. The value span is seeded from
// SpecialSystem.stats here; updateCharCreationUI() keeps it in sync after
// every +/- click.
import { STAT_META } from '../core/config.js';
import { MAX_STAT, STARTING_POINTS, STAT_KEYS, classifyArchetype, ARCHETYPES } from '../data/archetypes.js';
import { SpecialSystem } from '../engine/special.js';
import { UI } from './ui.js';
import type {StatKey, Stats} from '../core/types.js';


const renderStatRow = (key: StatKey): string => {
  const meta = STAT_META[key];
  return `
    <span class="stat-label" style="color: ${meta.color}">${key}</span>
    <span class="cons-info stat-help" data-stat="${key}" aria-label="About ${meta.name}">?</span>
    <span class="stat-name">${meta.name}</span>
    <div class="stat-controls">
      <button class="stat-btn minus" data-stat="${key}" data-action="minus">−</button>
      <span class="stat-value" style="color: ${meta.color}">${SpecialSystem.stats[key]}</span>
      <button class="stat-btn plus" data-stat="${key}" data-action="plus">+</button>
    </div>
  `;
};

export const UICharacter = {
  // Internal state (read/written via the composed UI object). Declared here
  // so the Object.assign composition in ui.js carries their types into UI.
  _presetToggleHandler: null as (() => void) | null,
  _presetCloseHandler: null as ((e: Event) => void) | null,

  // Render character creation screen
  renderCharacterCreation(): void {
    const container = document.getElementById('stat-allocation');
    if (!container) return;
    container.innerHTML = '';

    STAT_KEYS.forEach(key => {
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = renderStatRow(key);
      container.appendChild(row);
    });

    // The allocation lives in SpecialSystem.stats (startNewGame seeds it
    // with 1s); the rows are a view. updateCharCreationUI() syncs the
    // value spans and button states from the stats after every change.
    container.querySelectorAll<HTMLElement>('.stat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const stat = btn.dataset.stat as StatKey;
        const action = btn.dataset.action;
        const total = STAT_KEYS.reduce((s, k) => s + SpecialSystem.stats[k], 0);

        if (action === 'plus' && SpecialSystem.stats[stat] < MAX_STAT && total < STARTING_POINTS) {
          SpecialSystem.stats[stat]++;
          UI.updateCharCreationUI();
        } else if (action === 'minus' && SpecialSystem.stats[stat] > 1) {
          SpecialSystem.stats[stat]--;
          UI.updateCharCreationUI();
        }
      });
    });

    // "?" next to each stat — shows the stat's blurb via the shared tooltip.
    // Sits alongside the expandable "What does each stat do?" section so both
    // can be evaluated side by side.
    container.querySelectorAll<HTMLElement>('.stat-help').forEach(help => {
      help.addEventListener('click', (e) => {
        e.stopPropagation();
        const stat = help.dataset.stat as StatKey;
        const meta = STAT_META[stat];
        UI.showTooltip({ name: meta.short, desc: meta.desc, color: meta.color });
      });
    });

    UI.updateCharCreationUI();
    UI.renderArchetypePresets();
    UI.renderStatDescriptions();
  },

  // Render archetype preset dropdown
  renderArchetypePresets(): void {
    const container = document.getElementById('preset-options');
    const toggle = document.getElementById('preset-toggle');
    const toggleText = document.getElementById('preset-toggle-text');
    if (!container || !toggle || !toggleText) return;
    container.innerHTML = '';

    // Remove old listeners to prevent duplicates on re-render
    if (UI._presetToggleHandler) toggle.removeEventListener('click', UI._presetToggleHandler);
    if (UI._presetCloseHandler) document.removeEventListener('click', UI._presetCloseHandler);

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
          <span class="preset-name"><svg class="ach-lock-icon"><use href="#icon-padlock"/></svg> ${arch.name}</span>
          <span class="preset-stats">Locked</span>
        `;
      } else {
        btn.innerHTML = `
          <span class="preset-name">${arch.name}</span>
          <span class="preset-stats">${statStr}</span>
        `;
        btn.addEventListener('click', () => {
          UI.applyArchetypePreset(arch.stats);
          // Close dropdown and update toggle text
          container.classList.remove('open');
          toggle.classList.remove('open');
          toggleText.textContent = arch.name;
        });
      }

      container.appendChild(btn);
    });

    // Toggle dropdown
    UI._presetToggleHandler = () => {
      const isOpen = container.classList.contains('open');
      container.classList.toggle('open');
      toggle.classList.toggle('open');
    };
    toggle.addEventListener('click', UI._presetToggleHandler);

    // Close dropdown when clicking outside
    UI._presetCloseHandler = (e: Event) => {
      const dropdown = document.getElementById('preset-dropdown');
      if (dropdown && !dropdown.contains(e.target as Node)) {
        container.classList.remove('open');
        toggle.classList.remove('open');
      }
    };
    document.addEventListener('click', UI._presetCloseHandler);
  },

  // Apply an archetype preset to the stat allocation
  applyArchetypePreset(stats: Stats): void {
    // Replace the allocation; updateCharCreationUI() syncs the rows and the
    // preview (which re-detects the archetype from the new exact stats).
    STAT_KEYS.forEach(key => { SpecialSystem.stats[key] = stats[key]; });
    UI.updateCharCreationUI();
  },

  // Render stat descriptions
  renderStatDescriptions(): void {
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

  // Update character creation UI state — syncs the rows (value spans and
  // button states) from SpecialSystem.stats, the single source of truth
  updateCharCreationUI(): void {
    const container = document.getElementById('stat-allocation');
    if (!container) return;
    const currentStats = SpecialSystem.stats;

    const rows = container.querySelectorAll('.stat-row');
    rows.forEach(row => {
      const labelEl = row.querySelector('.stat-label');
      const valueEl = row.querySelector('.stat-value');
      if (!labelEl || !valueEl) return;
      valueEl.textContent = String(currentStats[labelEl.textContent as StatKey]);
    });

    const total = STAT_KEYS.reduce((sum, k) => sum + currentStats[k], 0);
    const remaining = STARTING_POINTS - total;
    const pointsEl = document.getElementById('points-remaining');
    if (pointsEl) pointsEl.textContent = String(remaining);

    const startBtn = document.getElementById('btn-start-career') as HTMLButtonElement;
    startBtn.disabled = remaining !== 0;

    // Update button disabled states
    rows.forEach(row => {
      const labelEl = row.querySelector('.stat-label');
      if (!labelEl) return;
      const minusBtn = row.querySelector('.stat-btn.minus') as HTMLButtonElement;
      const plusBtn = row.querySelector('.stat-btn.plus') as HTMLButtonElement;
      const value = currentStats[labelEl.textContent as StatKey];

      minusBtn.disabled = value <= 1;
      plusBtn.disabled = value >= MAX_STAT || total >= STARTING_POINTS;
    });

    // Update archetype preview
    UI.updateArchetypePreview();
  },

  // Update archetype preview based on the current allocation. Detects the
  // archetype by exact stat match (classifyArchetype); a non-matching custom
  // build shows as "Custom Engineer".
  updateArchetypePreview(): void {
    const preview = document.getElementById('archetype-preview');
    if (!preview) return;

    const key = classifyArchetype(SpecialSystem.stats);
    if (key === 'custom') {
      preview.innerHTML = `
        <div class="archetype-name">Custom Engineer</div>
        <div class="archetype-desc">You're truly SPECIAL — your build fits no mold.</div>
      `;
    } else {
      const arch = ARCHETYPES[key];
      preview.innerHTML = `
        <div class="archetype-name">${arch.name}</div>
        <div class="archetype-desc">${arch.description}</div>
      `;
    }
  },
};
