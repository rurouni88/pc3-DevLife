// Archetypes — predefined starting builds
import { CONFIG } from '../core/config.js';
import type { Archetype, StatKey, Stats } from '../core/types.js';

export const ARCHETYPES: Record<string, Archetype> = {
  architect: {
    name: "The Principal Architect",
    description: "High-level design & stakeholder alignment",
    stats: { S: 3, P: 5, E: 5, C: 8, I: 8, A: 6, L: 5 },
  },
  startup: {
    name: "The Rockstar Startup Engineer",
    description: "Ships fast, thrives in chaos",
    stats: { S: 4, P: 4, E: 8, C: 5, I: 6, A: 8, L: 5 },
  },
  systems: {
    name: "The Hardcore Systems Engineer",
    description: "Deep technical, low-level mastery",
    stats: { S: 9, P: 9, E: 5, C: 3, I: 6, A: 4, L: 4 },
  },
  advocate: {
    name: "The Developer Advocate",
    description: "Community builder, fast demos",
    stats: { S: 3, P: 5, E: 5, C: 9, I: 6, A: 7, L: 5 },
  },
  balanced: {
    name: "The Full-Stack Generalist",
    description: "Jack of all trades, master of enough",
    stats: { S: 5, P: 6, E: 6, C: 6, I: 6, A: 6, L: 5 },
  },
  // New archetypes
  sre: {
    name: "The DevOps / SRE Specialist",
    description: "Incident response, on-call survival, production stability",
    stats: { S: 4, P: 9, E: 10, C: 4, I: 6, A: 3, L: 4 },
  },
  pentester: {
    name: "The Cyber Security / Penetration Tester",
    description: "Exploit hunting, breaking things, finding anomalies",
    stats: { S: 3, P: 10, E: 4, C: 3, I: 10, A: 4, L: 6 },
  },
  archeologist: {
    name: "The Legacy Code Archeologist",
    description: "Reading ancient codebases without burning out",
    stats: { S: 9, P: 5, E: 9, C: 2, I: 8, A: 3, L: 4 },
  },
  em: {
    name: "The Engineering Manager",
    description: "People leadership, talent retention, org alignment",
    stats: { S: 2, P: 5, E: 9, C: 10, I: 5, A: 4, L: 5 },
  },
  // Unlockable archetype — stats deliberately sum to 42 (the Answer to the
  // Ultimate Question of Life, the Universe, and Everything), which is above the
  // 40-point budget. It can therefore never be an exact match: truly locked
  // until a real unlock path is implemented.
  prototype_king: {
    name: "The Prototype King / Hackathon Champion",
    description: "⚠️ LOCKED — Lightning-speed prototyping, demo-day legend",
    stats: { S: 2, P: 3, E: 3, C: 7, I: 7, A: 10, L: 10 },
  }
};


// CONFIG.stats.keys is validated at startup; the letters are the stat keys
export const STAT_KEYS: StatKey[] = CONFIG.stats.keys;
export const STARTING_POINTS = CONFIG.stats.startingPoints;
export const MAX_STAT = CONFIG.stats.max;

// Classify a stat build by EXACT match against the archetype declarations.
// Returns the archetype key whose stats match exactly, or 'custom' if none.
// Pure — used by both the character-creation preview and startCareer so the
// recorded starting archetype always matches what the player saw. Selecting a
// preset writes its exact stats, so detection naturally returns that preset.
// (prototype_king sums to 42 > the 40-point budget, so it can never match.)
export function classifyArchetype(stats: Stats): string {
  for (const [key, arch] of Object.entries(ARCHETYPES)) {
    if (STAT_KEYS.every(k => stats[k] === arch.stats[k])) return key;
  }
  return 'custom';
}
