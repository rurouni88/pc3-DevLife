// Events — loaded from per-phase JSON files
// Source files: js/events/phase_*.json

const EVENTS_PER_BOSS = CONFIG.game.eventsPerBoss;
const BOSS_PREFIX = CONFIG.game.bossPrefix;

const PHASE_FILES = {
  1: 'js/events/phase_junior.json',
  2: 'js/events/phase_mid.json',
  3: 'js/events/phase_senior.json',
  4: 'js/events/phase_staff.json',
};

// Global state
let EVENTS = [];
let _eventsLoaded = false;
let _resolveEvents = null;

// Load all phases and populate EVENTS
async function initEvents() {
  const promises = Object.values(PHASE_FILES).map(f => fetch(f).then(r => r.json()));
  const results = await Promise.all(promises);
  EVENTS = results.flat();
  _eventsLoaded = true;
  if (_resolveEvents) _resolveEvents();
}

// Wait for events to be loaded
function waitForEvents() {
  if (_eventsLoaded) return Promise.resolve();
  return new Promise(resolve => { _resolveEvents = resolve; });
}

// Get random NON-boss event for a given phase
function getRandomNonBossEvent(phase, excludeIds = []) {
  const phaseEvents = EVENTS.filter(e => e.phase === phase && !excludeIds.includes(e.id) && !e.title.startsWith(BOSS_PREFIX));
  if (phaseEvents.length === 0) return null;
  return phaseEvents[Math.floor(Math.random() * phaseEvents.length)];
}

// Get boss event for a phase
function getBossEvent(phase) {
  return EVENTS.find(e => e.phase === phase && e.title.startsWith(BOSS_PREFIX));
}

// Initialize event loading
initEvents().catch(err => {
  console.error('[DevLife] Failed to load events:', err);
  showEventsLoadError();
});

// Surface a load failure to the player. Without this, waitForEvents() never
// resolves and the title screen freezes with no explanation (the usual cause
// is opening index.html via file://, where fetch() is blocked).
function showEventsLoadError() {
  const screen = document.getElementById('screen-title');
  if (!screen) return;
  
  const error = document.createElement('div');
  error.className = 'events-load-error';
  error.innerHTML = `
    <strong>Failed to load game events.</strong>
    <p>The event files could not be fetched. Serve the game over HTTP — e.g. <code>npx serve</code> in the project root — and reload the page.</p>
  `;
  screen.appendChild(error);
}
