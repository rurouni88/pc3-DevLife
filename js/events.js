// Events — loaded from per-phase JSON files
// Source files: js/events/phase_*.json

const EVENTS_PER_BOSS = 6;
const BOSS_PREFIX = 'BOSS:';

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

// Load a specific phase
async function loadPhase(phase) {
  const resp = await fetch(PHASE_FILES[phase]);
  return resp.json();
}

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

// Get random event for a given phase (includes boss)
function getRandomEvent(phase, excludeIds = []) {
  const phaseEvents = EVENTS.filter(e => e.phase === phase && !excludeIds.includes(e.id));
  if (phaseEvents.length === 0) return null;
  return phaseEvents[Math.floor(Math.random() * phaseEvents.length)];
}

// Get random NON-boss event for a given phase
function getRandomNonBossEvent(phase, excludeIds = []) {
  const phaseEvents = EVENTS.filter(e => e.phase === phase && !excludeIds.includes(e.id) && !e.title.startsWith(BOSS_PREFIX));
  if (phaseEvents.length === 0) return null;
  return phaseEvents[Math.floor(Math.random() * phaseEvents.length)];
}

// Get all events for a phase (for tracking)
function getPhaseEvents(phase) {
  return EVENTS.filter(e => e.phase === phase);
}

// Get boss event for a phase
function getBossEvent(phase) {
  return EVENTS.find(e => e.phase === phase && e.title.startsWith(BOSS_PREFIX));
}

// Expose globals
window.EVENTS = EVENTS;
window.getRandomEvent = getRandomEvent;
window.getRandomNonBossEvent = getRandomNonBossEvent;
window.getPhaseEvents = getPhaseEvents;
window.getBossEvent = getBossEvent;
window.waitForEvents = waitForEvents;
window.EVENTS_PER_BOSS = EVENTS_PER_BOSS;
window.BOSS_PREFIX = BOSS_PREFIX;

// Initialize event loading
initEvents().catch(err => {
  console.error('[DevLife] Failed to load events:', err);
});
