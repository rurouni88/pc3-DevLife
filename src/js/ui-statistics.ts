// UI — statistics screen: lifetime career stats (issue #53).
// Presentation tier: owns the screen rendering and show/hide handlers.
// Data + logic (meta statistics, reset) live in meta.ts / achievements.ts;
// this file depends on that tier, never the reverse.
// Loaded before ui.js; its methods are composed into UI there.

// Render a single statistics entry as HTML.
function renderStatisticRow(label: string, value: string): string {
  return `
    <div class="stat-row-entry">
      <span class="stat-row-label">${label}</span>
      <span class="stat-row-value" style="font-family:var(--font-mono);font-weight:700;">${value}</span>
    </div>`;
}

const UIStatistics = {
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
    html += renderStatisticRow('Deaths (Losses)', String(stats.losses));
    html += renderStatisticRow('Win Rate', totalRuns > 0 ? `${winRate}%` : '—');
    html += renderStatisticRow('Best Run', stats.bestDay > 0 ? `Day ${stats.bestDay} (${stats.bestDayDifficulty})` : '—');
    html += renderStatisticRow('Last Run', lastRunDate ? new Date(lastRunDate).toLocaleDateString() : '—');

    // Win rate by difficulty (issue #53).
    (['easy', 'normal', 'hard'] as Difficulty[]).forEach(d => {
      const w = stats.winsByDifficulty[d] || 0;
      const l = stats.lossesByDifficulty[d] || 0;
      const played = w + l;
      const rate = played > 0 ? Math.round((w / played) * 100) : null;
      const label = CONFIG.game.difficulty[d].emoji + ' ' + CONFIG.game.difficulty[d].label;
      html += renderStatisticRow(`Win Rate (${label})`, rate === null ? '—' : `${rate}% (${w}/${played})`);
    });

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
