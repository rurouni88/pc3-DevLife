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

/** @type {GameEvent[]} */
let EVENTS = [];
let _eventsLoaded = false;
let _resolveEvents = null;

// Load all phases and populate EVENTS
/** @returns {Promise<void>} */
async function initEvents() {
  const promises = Object.values(PHASE_FILES).map(f => fetch(f).then(r => r.json()));
  const results = await Promise.all(promises);
  const events = results.flat();
  validateEvents(events);
  EVENTS = events;
  _eventsLoaded = true;
  if (_resolveEvents) _resolveEvents();
}

// Wait for events to be loaded
/** @returns {Promise<void>} */
function waitForEvents() {
  if (_eventsLoaded) return Promise.resolve();
  return new Promise(resolve => { _resolveEvents = resolve; });
}

// Get random NON-boss event for a given phase
/** @param {number} phase @param {string[]} [excludeIds] @returns {GameEvent | null} */
function getRandomNonBossEvent(phase, excludeIds = []) {
  const phaseEvents = EVENTS.filter(e => e.phase === phase && !excludeIds.includes(e.id) && !e.title.startsWith(BOSS_PREFIX));
  if (phaseEvents.length === 0) return null;
  return phaseEvents[Math.floor(Math.random() * phaseEvents.length)];
}

// Get boss event for a phase
/** @param {number} phase @returns {GameEvent | undefined} */
function getBossEvent(phase) {
  return EVENTS.find(e => e.phase === phase && e.title.startsWith(BOSS_PREFIX));
}

// Validate the event JSON at the loading boundary. A malformed event file
// otherwise fails mid-game (undefined .choices on a random pick), which is
// much harder to diagnose than a startup error.
/** @param {GameEvent[]} events */
function validateEvents(events) {
  if (!Array.isArray(events) || events.length === 0) {
    throw new Error('Event files loaded but contain no events');
  }
  
  events.forEach((event, i) => {
    if (!event.id || !event.title || typeof event.phase !== 'number' || !Array.isArray(event.choices)) {
      throw new Error(`Event at index ${i} is missing id/title/phase/choices`);
    }
    event.choices.forEach((choice, j) => {
      if (!choice.text || !choice.success || !choice.failure) {
        throw new Error(`Event '${event.id}' choice ${j} is missing text/success/failure`);
      }
      for (const branch of [choice.success, choice.failure]) {
        if (!branch.effects || !branch.log) {
          throw new Error(`Event '${event.id}' choice ${j} branch missing effects/log`);
        }
      }
      if (choice.checks) {
        for (const stat of Object.keys(choice.checks)) {
          if (!CONFIG.stats.keys.includes(stat)) {
            throw new Error(`Event '${event.id}' choice ${j} checks unknown stat '${stat}'`);
          }
        }
      }
    });
  });
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
