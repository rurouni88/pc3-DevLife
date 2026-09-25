// UI — the shared tooltip component. One #item-tooltip element driven by
// showTooltip/hideTooltip, triggered by the difficulty & consumable "?"
// buttons, the equipment list, and the perk chips. Loaded before ui.js; its
// methods are composed into UI there.
import { STAT_META } from '../core/config.js';
import { equipmentEffectText } from '../core/utils.js';
import { UI } from './ui.js';
import type {StatKey, Stats} from '../core/types.js';


export const UITooltip = {
  // Show the item tooltip (consumables, equipment, perks).
  showTooltip(item: {
    emoji?: string;
    name?: string;
    desc?: string;
    stat?: string;
    bonus?: number;
    multiplier?: number;
    effects?: Partial<Stats>;
    consumableSlots?: number;
    color?: string;
    icon?: string;  // SVG icon ID (e.g. 'icon-speaker')
  }): void {
    const tooltip = document.getElementById('item-tooltip');
    if (!tooltip) return;

    const setTooltipText = (sel: string, text: string): void => {
      const el = tooltip.querySelector(sel);
      if (el) el.textContent = text;
    };

    // Render SVG icon if provided, otherwise fall back to emoji text.
    const emojiEl = tooltip.querySelector<HTMLElement>('.tooltip-emoji');
    if (emojiEl) {
      if (item.icon) {
        emojiEl.innerHTML = `<svg class="tooltip-icon"><use href="#${item.icon}"/></svg>`;
        emojiEl.style.color = item.color || '';
      } else {
        emojiEl.textContent = item.emoji || '';
        emojiEl.style.color = item.color || '';
      }
    }
    setTooltipText('.tooltip-name', item.name || '');
    setTooltipText('.tooltip-desc', item.desc || '');

    // Optional accent colour for the name (e.g. a stat's colour).
    const nameEl = tooltip.querySelector<HTMLElement>('.tooltip-name');
    if (nameEl) nameEl.style.color = item.color || '';

    // Build effect text (only for consumables/equipment, not perks)
    let effectText = '';
    if (item.stat && item.bonus) {
      effectText = `+${item.bonus} ${item.stat === 'any' ? 'ANY stat' : STAT_META[item.stat as StatKey]?.name || item.stat}`;
    } else if (item.multiplier) {
      effectText = `${item.multiplier}× stat (risky)`;
    } else if (item.effects || item.consumableSlots) {
      effectText = equipmentEffectText(item);
    }
    const effectEl = tooltip.querySelector<HTMLElement>('.tooltip-effect');
    if (!effectEl) return;
    effectEl.textContent = effectText;
    effectEl.style.display = effectText ? 'block' : 'none';

    tooltip.style.display = 'block';
  },

  hideTooltip(): void {
    const tooltip = document.getElementById('item-tooltip');
    if (tooltip) tooltip.style.display = 'none';
  },

  // Wire up the click-to-close behaviour for the tooltip. (The character
  // modal's close handling lives in UICore.initPopupClose.)
  initTooltipClose(): void {
    const tooltip = document.getElementById('item-tooltip');
    if (!tooltip) return;

    // Close the tooltip when clicking on it
    tooltip.addEventListener('click', (e) => {
      e.stopPropagation();
      UI.hideTooltip();
    });

    // Close the tooltip when clicking outside (but not on a "?" trigger)
    document.addEventListener('click', (e) => {
      if (tooltip.style.display === 'none') return;
      const target = e.target as Element;
      if (tooltip.contains(target)) return;
      if (target.classList.contains('cons-info')) return;
      UI.hideTooltip();
    });
  },
};
