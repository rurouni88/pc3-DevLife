// UI — settings screen: seed display and re-roll (issue #59).
// Presentation tier: owns the screen rendering and show/hide handlers.
// Seeded RNG logic lives in seeded-rng.ts; this file depends on it, never
// the reverse.
// Loaded before ui.js; its methods are composed into UI there.

const UISettings = {
  // Show the settings screen (seed display + re-roll).
  showSettings(): void {
    UI.renderSettings();
    UI.showScreen('settings');
  },

  // Back to the title screen.
  closeSettings(): void {
    UI.showScreen('title');
  },

  // Render the seed display from RngEngine.
  renderSettings(): void {
    const display = document.getElementById('settings-seed-display');
    const value = document.getElementById('settings-seed-value');
    if (!display || !value) return;

    const seed = RngEngine.seed || RngEngine.generateSeed();
    RngEngine.seedWith(seed);
    value.textContent = seed;
    display.style.display = 'flex';

    // Seed display is only relevant on the title/settings screens.
    display.classList.add('active');
  },
};
