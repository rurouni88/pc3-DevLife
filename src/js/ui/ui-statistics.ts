// UI — statistics screen: lifetime career stats (issue #53).
// Presentation tier: owns the screen rendering and show/hide handlers.
// Data + logic (meta statistics, reset) live in meta.ts / achievements.ts;
// this file depends on that tier, never the reverse.
// Loaded before ui.js; its methods are composed into UI there.

// Render a single statistics entry as HTML.
import { CONFIG, STAT_META } from '../core/config.js';
import { STAT_KEYS } from '../data/archetypes.js';
import { MetaStore } from '../engine/meta.js';
import { UI } from './ui.js';
import type {StatKey} from '../core/types.js';


function renderStatisticRow(label: string, value: string): string {
  return `
    <div class="stat-row-entry">
      <span class="stat-row-label">${label}</span>
      <span class="stat-row-value" style="font-family:var(--font-mono);font-weight:700;">${value}</span>
    </div>`;
}

export const UIStatistics = {
  // Show the statistics screen (populated fresh each time).
  showStatistics(): void {
    UI.renderStatistics();
    UI.showScreen('statistics');
  },

  // Back to the title screen.
  closeStatistics(): void {
    UI.showScreen('title');
  },

  // Render the statistics list from MetaStore.
  renderStatistics(): void {
    const container = document.getElementById('statistics-list');
    if (!container) return;

    const stats = MetaStore.metaStats();
    const totalRuns = MetaStore.runCount();
    const lastRunDate = MetaStore.load().lastRunDate;

    const winRate = totalRuns > 0
      ? Math.round((stats.wins / totalRuns) * 100)
      : 0;

    let html = '';
    html += renderStatisticRow('Total Careers', String(totalRuns));
    html += renderStatisticRow('Retirements (Wins)', String(stats.wins));
    html += renderStatisticRow('Failures (Losses)', String(stats.losses));
    html += renderStatisticRow('Win Rate', totalRuns > 0 ? `${winRate}%` : '—');
    // Career length in years (12 days = 1 career year) — matches the run
    // summaries, which report "Career Length" in years.
    html += renderStatisticRow('Best Run', stats.bestDay > 0 ? `${(stats.bestDay / CONFIG.game.daysPerCareerYear).toFixed(1)} years (${stats.bestDayDifficulty})` : '—');
    // lastRunDate is stored as ISO 8601 (UTC) — render it in the
    // browser's local time zone for readability.
    html += renderStatisticRow('Last Run', lastRunDate ? new Date(lastRunDate).toLocaleString() : '—');

    // Consumables used (issue #53).
    const consTotal = stats.consumablesUsedTotal;
    const consAvg = totalRuns > 0 ? (consTotal / totalRuns).toFixed(1) : null;
    html += renderStatisticRow('Consumables Used (Total)', String(consTotal));
    html += renderStatisticRow('Consumables Used (Avg/Run)', consAvg === null ? '—' : consAvg);

    // Highest / lowest average SPECIAL (issue #53).
    // Average per stat = statTotals[k] / totalRuns; we show the stat with the
    // highest and lowest lifetime average.
    if (totalRuns > 0) {
      let hiKey: StatKey = STAT_KEYS[0];
      let loKey: StatKey = STAT_KEYS[0];
      let hiAvg = -1;
      let loAvg = Infinity;
      STAT_KEYS.forEach(k => {
        const avg = stats.statTotals[k] / totalRuns;
        if (avg > hiAvg) { hiAvg = avg; hiKey = k; }
        if (avg < loAvg) { loAvg = avg; loKey = k; }
      });
      html += renderStatisticRow('Highest Avg SPECIAL', `${hiKey} — ${STAT_META[hiKey].name} (${hiAvg.toFixed(1)})`);
      html += renderStatisticRow('Lowest Avg SPECIAL', `${loKey} — ${STAT_META[loKey].name} (${loAvg.toFixed(1)})`);
    } else {
      html += renderStatisticRow('Highest Avg SPECIAL', '—');
      html += renderStatisticRow('Lowest Avg SPECIAL', '—');
    }

    container.innerHTML = html;
  },
};
