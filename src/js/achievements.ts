// Achievements are kept inline (not src/data/*.json) because:
// 1. Small dataset — 26 achievements = ~150 lines.
// 2. TypeScript safety — typed conditions, archetype IDs, and difficulty enums.
// 3. Static config — never changes at runtime, so no need for async fetch.
// 4. Tight coupling with game state — conditions reference SpecialSystem, Game, CONFIG.
// Contrast with events (src/data/events/) which are large (45-57KB each) and content-driven.

// --- Types ---

type AchievementMode = 'Any' | 'Normal' | 'Hard';

interface AchievementDefinition {
  id: string;
  mode: AchievementMode;
  title: string;
  description: string;
  emoji: string;
  implemented?: boolean;
}

interface ArchetypeAchievement extends AchievementDefinition {
  archetype: string;
}

// --- Universal Achievements ---

const UNIVERSAL_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'campaign_normal_universal',
    mode: 'Normal',
    title: "It Works On My Machine.",
    description: "Completed the game on Normal difficulty. It's a bit 'site'-specific, but hey, a win is a win!",
    emoji: '🎮',
    implemented: false,
  },
  {
    id: 'campaign_hard_universal',
    mode: 'Hard',
    title: 'Fixed In Production.',
    description: "Completed the game on Hard difficulty without reading the documentation. Talk about deploying a high-'risk' architecture!",
    emoji: '🏆',
    implemented: false,
  },
  {
    id: 'consumable_0',
    mode: 'Any',
    title: "Consumer's Choice",
    description: "No consumables used in a Run. You don't believe in food & substance abuse.",
    emoji: '🥗',
    implemented: false,
  },
  {
    id: 'stat_max_4',
    mode: 'Any',
    title: 'Maxellent',
    description: "Max out 4 categories of stats in a Run. You've optimized your profile to a 'C-level' standard—mostly style, a fair bit of substance, and totally 'scalable'.",
    emoji: '⭐',
    implemented: false,
  },
  {
    id: 'stat_max_5',
    mode: 'Any',
    title: 'Maxcerrific',
    description: "Max out 5 categories of stats in a Run. A masterful display of data serialization. You're pushing the absolute 'parameter' of what this build can handle.",
    emoji: '💎',
    implemented: false,
  },
  {
    id: 'stat_max_6',
    mode: 'Any',
    title: 'Maxterful',
    description: "Max out 6 categories of stats in a Run. Your stats are so heavily stacked, you're causing an arithmetic 'overflow' in the HR department.",
    emoji: '🥇',
    implemented: false,
  },
  {
    id: 'stat_max_7',
    mode: 'Any',
    title: 'Living Life to the Max',
    description: "Max out 7 categories of stats in a Run. The absolute peak of multi-threading. You are the fabled '10x' developer, completely untethered from 'string'ent realities.",
    emoji: '👑',
    implemented: false,
  },
  {
    id: 'stat_consumable_5',
    mode: 'Any',
    title: 'Load Bearing',
    description: "Unlock 5 consumable slots. Your inventory is held together by a single string of legacy code. If you try to 'unload' just one item, the whole stack will 'overflow' and bring down the system.",
    emoji: '📦',
    implemented: false,
  },
];

// --- Archetype Achievements ---

const ARCHETYPE_ACHIEVEMENTS: Record<string, ArchetypeAchievement[]> = {
  architect: [
    {
      archetype: 'architect',
      mode: 'Normal',
      id: 'architect_normal',
      title: 'The Ivory Tower',
      description: "Successfully launched an abstract, theoretical framework that works perfectly as long as real users never touch it. A truly 'model' citizen.",
      emoji: '🏰',
      implemented: false,
    },
    {
      archetype: 'architect',
      mode: 'Hard',
      id: 'architect_hard',
      title: 'Drawings on a Napkin',
      description: "Completed the game using nothing but 47 interconnected UML diagrams and a prayer. You really drew the short 'string' on this layout.",
      emoji: '📝',
      implemented: false,
    },
  ],
  startup_engineer: [
    {
      archetype: 'startup_engineer',
      mode: 'Normal',
      id: 'startup_engineer_normal',
      title: 'Move Fast and Break Things',
      description: "Shipped a product that is 90% technical debt and 10% premium venture capital. You sure know how to 'capital'-ise on chaos!",
      emoji: '💥',
      implemented: false,
    },
    {
      archetype: 'startup_engineer',
      mode: 'Hard',
      id: 'startup_engineer_hard',
      title: 'Pivot to AI',
      description: "Completely rewrote the core gameplay loop at 3 AM the night before launch because the CEO saw a tweet. Talk about an artificial 'intelligence' crisis!",
      emoji: '🔄',
      implemented: false,
    },
  ],
  hardcore_systems_engineer: [
    {
      archetype: 'hardcore_systems_engineer',
      mode: 'Normal',
      id: 'hardcore_systems_engineer_normal',
      title: 'Manual Memory Management',
      description: "Finished the game without a single memory leak, though it took ten years off your life. Thanks for the 'memories', but please 'free' yourself.",
      emoji: '💾',
      implemented: false,
    },
    {
      archetype: 'hardcore_systems_engineer',
      mode: 'Hard',
      id: 'hardcore_systems_engineer_hard',
      title: 'Bare Metal and Blood',
      description: "Refused to use any libraries and beat the game using only C, custom assembly, and sheer stubbornness. You've truly got some 'register'-ed anger issues.",
      emoji: '🩸',
      implemented: false,
    },
  ],
  developer_advocate: [
    {
      archetype: 'developer_advocate',
      mode: 'Normal',
      id: 'developer_advocate_normal',
      title: 'Inflated Metrics',
      description: "Successfully convinced everyone the game was a masterpiece via a 45-minute keynote presentation and free t-shirts. What an absolute 'bazaar' way to push your 'git'-hub swag.",
      emoji: '📣',
      implemented: false,
    },
    {
      archetype: 'developer_advocate',
      mode: 'Hard',
      id: 'developer_advocate_hard',
      title: 'Climbing the Hype Cycle',
      description: "Managed to maintain a smile and complete the game while being bombarded by toxic comments on Hacker News. Way to 'buffer' the incoming insults!",
      emoji: '🎢',
      implemented: false,
    },
  ],
  full_stack_generalist: [
    {
      archetype: 'full_stack_generalist',
      mode: 'Normal',
      id: 'full_stack_generalist_normal',
      title: 'Jack of All Trades, Master of None',
      description: "Centred a div and optimized a SQL query in the same afternoon. You are exhausted, but you really know how to find a middle 'ground'.",
      emoji: '🛠️',
      implemented: false,
    },
    {
      archetype: 'full_stack_generalist',
      mode: 'Hard',
      id: 'full_stack_generalist_hard',
      title: 'Context-Switching Whiplash',
      description: "Completed the game while simultaneously wrestling with CSS specificity and database deadlocks. Talk about a 'class'ic case of mixed 'signals'.",
      emoji: '🌀',
      implemented: false,
    },
  ],
  devops_sre_specialist: [
    {
      archetype: 'devops_sre_specialist',
      mode: 'Normal',
      id: 'devops_sre_specialist_normal',
      title: 'The Five Nines',
      description: "Maintained 99.999% uptime during the finale, mostly by turning everything off and on again. Your methods are a bit 'terminal', but effective.",
      emoji: '⏱️',
      implemented: false,
    },
    {
      archetype: 'devops_sre_specialist',
      mode: 'Hard',
      id: 'devops_sre_specialist_hard',
      title: 'PagerDuty PTSD',
      description: "Beat the game while the alarm siren was constantly blaring in the background. You really know how to keep your composure under intense 'pipeline' pressure.",
      emoji: '🚨',
      implemented: false,
    },
  ],
  cyber_security_penetration_tester: [
    {
      archetype: 'cyber_security_penetration_tester',
      mode: 'Normal',
      id: 'cyber_security_penetration_tester_normal',
      title: "I'm In.",
      description: "Bypassed all standard gameplay mechanics by exploiting a known vulnerability in the dialogue system. You've truly 'breached' a new level of laziness.",
      emoji: '🔓',
      implemented: false,
    },
    {
      archetype: 'cyber_security_penetration_tester',
      mode: 'Hard',
      id: 'cyber_security_penetration_tester_hard',
      title: 'Socially Engineered',
      description: "Beat the final boss by guessing their password was 'Password123!'. They really handed over the 'keys' to the kingdom on a silver platter.",
      emoji: '🎣',
      implemented: false,
    },
  ],
  legacy_code_archaeologist: [
    {
      archetype: 'legacy_code_archaeologist',
      mode: 'Normal',
      id: 'legacy_code_archaeologist_normal',
      title: "Don't Touch That Block",
      description: "Navigated a 20-year-old codebase without accidentally bringing down a major banking system. One wrong move and it's a total 'collapse' of the asset 'branch'.",
      emoji: '🧱',
      implemented: false,
    },
    {
      archetype: 'legacy_code_archaeologist',
      mode: 'Hard',
      id: 'legacy_code_archaeologist_hard',
      title: 'The COBOL Necromancer',
      description: "Successfully summoned and debugged code written by a developer who retired before you were born. That's some ancient 'history' you've just 'compiled'.",
      emoji: '💀',
      implemented: false,
    },
  ],
  engineering_manager: [
    {
      archetype: 'engineering_manager',
      mode: 'Normal',
      id: 'engineering_manager_normal',
      title: 'Herding Cats',
      description: "Got everyone to complete their tasks on time, despite 14 conflicting opinions on code formatting. It's tough trying to keep everyone aligned on the same 'line' of thought.",
      emoji: '🐱',
      implemented: false,
    },
    {
      archetype: 'engineering_manager',
      mode: 'Hard',
      id: 'engineering_manager_hard',
      title: 'This Could Have Been an Email',
      description: "Beat the final boss solely by scheduling back-to-back status update meetings until they surrendered. You really 'blocked' their schedule into submission.",
      emoji: '📧',
      implemented: false,
    },
  ],
};

// --- Achievement Tracker ---

// Achievement states for rendering.
type AchievementState = 'unlocked' | 'notImplemented' | 'locked';

// Check if an achievement is not yet implemented (type guard).
function isNotImplemented(ach: AchievementDefinition): ach is AchievementDefinition & { implemented: false } {
  return ach.implemented === false;
}

// Render a single achievement card as HTML.
function renderAchievementCard(ach: AchievementDefinition, state: AchievementState): string {
  const isUnlocked = state === 'unlocked';
  const isNotImpl = state === 'notImplemented';
  const cssClass = isUnlocked ? 'achievement-unlocked' : 'achievement-locked';
  const lockIcon = isNotImpl ? ' <span style="color: var(--text-muted);">🔒</span>' : '';
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

// Determine the render state for an achievement.
function getAchievementState(ach: AchievementDefinition, unlocked: Set<string>): AchievementState {
  if (unlocked.has(ach.id)) return 'unlocked';
  if (isNotImplemented(ach)) return 'notImplemented';
  return 'locked';
}

// Achievement storage key in localStorage.
const ACHIEVEMENTS_STORAGE_KEY = 'devlife_achievements';

// Get the set of unlocked achievement IDs from localStorage.
function getUnlocked(): Set<string> {
  try {
    const data = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (data) {
      return new Set(JSON.parse(data) as string[]);
    }
  } catch {
    // Corrupted data — start fresh
  }
  return new Set<string>();
}

// Save the set of unlocked achievement IDs to localStorage.
function saveUnlocked(unlocked: Set<string>): void {
  try {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify([...unlocked]));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

// Check if an achievement should be unlocked based on current game state.
// Returns true if the achievement is newly unlocked.
function checkAchievement(
  achievementId: string,
  gameState: GameState,
): boolean {
  // This function will be expanded as we implement each achievement condition.
  // For now, it returns false for all achievements.
  return false;
}

// Export for use in other modules
const Achievements = {
  UNIVERSAL_ACHIEVEMENTS,
  ARCHETYPE_ACHIEVEMENTS,
  checkAchievement,
  getUnlocked,
  saveUnlocked,
  renderAchievementCard,
  getAchievementState,
  isNotImplemented,
};
