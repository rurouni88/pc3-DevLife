// UI — achievements modal: title-screen button, flat list of all achievements.
// Presentation tier: owns the card rendering and the show/hide handlers.
// Data + logic (definitions, localStorage, evaluation) live in
// achievements.ts; this file depends on that tier, never the reverse.
// Loaded before ui.js; its methods are composed into UI there.

// Render state for a single achievement.
type AchievementState = 'unlocked' | 'notImplemented' | 'locked';

// Render a single achievement card as HTML.
function renderAchievementCard(ach: AchievementDefinition, state: AchievementState): string {
  const isUnlocked = state === 'unlocked';
  const isNotImpl = state === 'notImplemented';
  const cssClass = isUnlocked ? 'achievement-unlocked' : 'achievement-locked';
  const lockIcon = isNotImpl ? ' <svg class="ach-lock-icon" style="color: var(--text-muted);"><use href="#icon-padlock"/></svg>' : '';
  const description = isUnlocked ? ach.description : isNotImpl ? 'Not yet implemented' : 'Complete achievements to unlock this.';

  return `
    <div class="achievement-item ${cssClass}">
      <div class="achievement-emoji">${ach.emoji}</div>
      <div class="achievement-info">
        <div class="achievement-title">${ach.title}${lockIcon}</div>
        <div class="achievement-desc">${description}</div>
      </div>
    </div>`;
}

// Map an achievement + the unlocked set to its render state.
function getAchievementState(ach: AchievementDefinition, unlocked: Set<string>): AchievementState {
  if (unlocked.has(ach.id)) return 'unlocked';
  if (isNotImplemented(ach)) return 'notImplemented';
  return 'locked';
}

const UIAchievements = {
  // Show the achievements modal.
  showAchievements(): void {
    UI.renderAchievements();
    document.getElementById('achievements-modal')?.style.setProperty('display', 'flex');
  },

  // Hide the achievements modal.
  closeAchievements(): void {
    document.getElementById('achievements-modal')?.style.setProperty('display', 'none');
  },

  // Render the achievements list.
  renderAchievements(): void {
    const container = document.getElementById('achievements-list');
    if (!container) return;

    const unlocked = Achievements.getUnlocked();

    // Universal achievements
    let html = Achievements.UNIVERSAL_ACHIEVEMENTS
      .map(ach => renderAchievementCard(ach, getAchievementState(ach, unlocked)))
      .join('');

    // Archetype achievements
    for (const achs of Object.values(Achievements.ARCHETYPE_ACHIEVEMENTS)) {
      html += achs
        .map(ach => renderAchievementCard(ach, getAchievementState(ach, unlocked)))
        .join('');
    }

    container.innerHTML = html;
  },
};
