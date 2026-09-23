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

    container.innerHTML = html;
  },
};
