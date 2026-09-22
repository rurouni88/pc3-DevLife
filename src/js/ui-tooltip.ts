// UI — the shared tooltip component. One #item-tooltip element driven by
// showTooltip/hideTooltip, triggered by the difficulty & consumable "?"
// buttons, the equipment list, and the perk chips. Loaded before ui.js; its
// methods are composed into UI there.
const UITooltip = {
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
  }): void {
    const tooltip = document.getElementById('item-tooltip');
    if (!tooltip) return;

    const setTooltipText = (sel: string, text: string): void => {
      const el = tooltip.querySelector(sel);
      if (el) el.textContent = text;
    };
    setTooltipText('.tooltip-emoji', item.emoji || '');
    setTooltipText('.tooltip-name', item.name || '');
    setTooltipText('.tooltip-desc', item.desc || '');

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
