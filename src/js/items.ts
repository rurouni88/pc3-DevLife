// Equipment and consumables are kept inline (not src/data/*.json) because:
// 1. Small datasets — 15 equip + 31 consumable = ~94 lines total.
// 2. TypeScript safety — discriminated unions (bonus vs multiplier) enforced at compile time.
// 3. Tightly coupled logic — RARITY_WEIGHTS and getRandomEquipment() live next to the data.
// 4. Static config — never changes at runtime, so no need for async fetch.
// Contrast with events (src/data/events/) which are large (45-57KB each) and content-driven.
const EQUIPMENT: Equipment[] = [
  // Common
  { id: 'keyboard', name: 'Mechanical Keyboard', emoji: '⌨️', rarity: 'common', effects: { S: 1 }, desc: '+1 Strength' },
  { id: 'headphones', name: 'Noise-Canceling Headphones', emoji: '🎧', rarity: 'common', effects: { E: 1 }, desc: '+1 Endurance' },
  { id: 'duck', name: 'Rubber Duck', emoji: '🦆', rarity: 'common', effects: { P: 1 }, desc: '+1 Perception' },
  { id: 'monitor', name: 'Ultrawide Monitor', emoji: '🖥️', rarity: 'common', effects: { P: 1, A: 1 }, desc: '+1 Perception, +1 Agility' },

  // Uncommon
  { id: 'claude', name: 'Claude Code', emoji: '🤖', rarity: 'uncommon', effects: { L: 1 }, desc: '+1 Luck — The AI writes it. You pretend you understand it.' },
  { id: 'systemdesign', name: 'System Design Interview Prep', emoji: '📊', rarity: 'uncommon', effects: { I: 1 }, desc: '+1 Intelligence — You can now draw boxes and arrows confidently.' },
  { id: 'ddd', name: 'Domain-Driven Design', emoji: '📐', rarity: 'uncommon', effects: { I: 2 }, desc: '+2 Intelligence — You can now split your monolith into 47 services.' },

  // Rare
  { id: 'togaf', name: 'TOGAF Certification', emoji: '📜', rarity: 'rare', effects: { C: 2 }, desc: '+2 Charisma' },
  { id: 'macbook', name: 'MacBook Pro M5', emoji: '💻', rarity: 'rare', effects: { I: 1, A: 1 }, desc: '+1 Intelligence, +1 Agility — It just works. Mostly.' },
  { id: 'aws', name: 'AWS Certification', emoji: '☁️', rarity: 'rare', effects: { I: 1, S: 1 }, desc: '+1 Intelligence, +1 Strength' },
  { id: 'standing', name: 'Standing Desk', emoji: '🪑', rarity: 'rare', effects: { E: 2 }, desc: '+2 Endurance' },
  { id: 'backpack', name: 'Backpack', emoji: '🎒', rarity: 'rare', effects: {}, consumableSlots: 1, desc: '+1 consumable slot' },

  // Epic
  { id: 'chair', name: 'Custom Ergonomic Chair', emoji: '💺', rarity: 'epic', effects: { E: 3 }, desc: '+3 Endurance' },
  { id: 'homeoffice', name: 'Home Office Setup', emoji: '🏠', rarity: 'epic', effects: { P: 1, E: 1, A: 1 }, desc: '+1 Perception, +1 Endurance, +1 Agility' }
];

const CONSUMABLES: Consumable[] = [
  // Common — food & substances
  { id: 'coffee', name: 'Coffee', emoji: '☕', rarity: 'common', stat: 'E', bonus: 2, desc: '+2 Endurance on next check' },
  { id: 'energy_drink', name: 'Energy Drink', emoji: '🥤', rarity: 'common', stat: 'A', bonus: 2, desc: '+2 Agility on next check' },
  { id: 'redbull', name: 'Red Bull', emoji: '🐂', rarity: 'common', stat: 'E', bonus: 3, desc: '+3 Endurance on next check' },
  { id: 'vitamin', name: 'Vitamin Pill', emoji: '💊', rarity: 'common', stat: 'E', bonus: 1, desc: '+1 Endurance on next check' },
  { id: 'instant_noodles', name: 'Instant Noodles', emoji: '🍜', rarity: 'common', stat: 'E', bonus: 2, desc: '+2 Endurance — 3 minutes to survival. 3 hours to regret.' },
  { id: 'energy_gel', name: 'Energy Gel', emoji: '🧴', rarity: 'common', stat: 'A', bonus: 2, desc: '+2 Agility — Squeeze, swallow, ship.' },
  { id: 'protein_bar', name: 'Protein Bar', emoji: '🍫', rarity: 'common', stat: 'E', bonus: 1, desc: '+1 Endurance — Tastes like cardboard. Works like magic.' },
  { id: 'cold_pizza', name: 'Cold Pizza', emoji: '🍕', rarity: 'common', stat: 'C', bonus: 2, desc: '+2 Charisma — The universal developer currency.' },

  // Uncommon — food & substances
  { id: 'focus', name: 'Focus Session', emoji: '🧘', rarity: 'uncommon', stat: 'P', bonus: 3, desc: '+3 Perception on next check' },
  { id: 'whiteboard', name: 'Whiteboard Session', emoji: '📋', rarity: 'uncommon', stat: 'I', bonus: 3, desc: '+3 Intelligence on next check' },
  { id: 'pair_program', name: 'Pair Programming', emoji: '👥', rarity: 'uncommon', stat: 'C', bonus: 3, desc: '+3 Charisma on next check' },
  { id: 'espresso', name: 'Espresso Shot', emoji: '☕', rarity: 'uncommon', stat: 'P', bonus: 3, desc: '+3 Perception — One shot. Pure clarity. The bug will reveal itself.' },
  { id: 'matcha', name: 'Matcha Latte', emoji: '🍵', rarity: 'uncommon', stat: 'I', bonus: 3, desc: '+3 Intelligence — Zen focus for when you need to architect the impossible.' },
  { id: 'dark_chocolate', name: 'Dark Chocolate', emoji: '🍫', rarity: 'uncommon', stat: 'C', bonus: 2, desc: '+2 Charisma — Share with the team. They\'ll forgive you for the merge conflict.' },
  { id: 'pre_workout', name: 'Pre-Workout', emoji: '💪', rarity: 'uncommon', stat: 'A', bonus: 3, desc: '+3 Agility, +1 Endurance — Jitters guaranteed. Shipping accelerated.' },

  // Rare — food & substances
  { id: 'deep_work', name: 'Deep Work Block', emoji: '🎯', rarity: 'rare', stat: 'S', bonus: 4, desc: '+4 Strength on next check' },
  { id: 'lucky_charm', name: 'Lucky Socks', emoji: '🧦', rarity: 'rare', stat: 'L', bonus: 4, desc: '+4 Luck on next check' },
  { id: 'caffeine_iv', name: 'Caffeine IV Drip', emoji: '💉', rarity: 'rare', stat: 'S', bonus: 4, desc: '+4 Strength, +3 Endurance — For when coffee just isn\'t cutting it anymore.' },
  { id: 'ghost_pepper', name: 'Ghost Pepper Hot Sauce', emoji: '🌶️', rarity: 'rare', stat: 'A', bonus: 4, desc: '+4 Agility, -1 Endurance — Fire in your veins. Fire in your gut. Code so fast it burns.' },
  { id: 'truffle_pasta', name: 'Truffle Pasta', emoji: '🍝', rarity: 'rare', stat: 'C', bonus: 3, desc: '+3 Charisma, +2 Luck — The PM actually enjoyed it. Miracles happen.' },

  // Epic — food & substances
  { id: 'flow_state', name: 'Flow State', emoji: '⚡', rarity: 'epic', stat: 'any', bonus: 5, desc: '+5 to ANY stat on next check' },
  { id: 'perfect_meal', name: 'The Perfect Meal', emoji: '🍱', rarity: 'epic', stat: 'any', bonus: 5, desc: '+5 to ANY stat — Home-cooked. Made by someone who cares. Everything clicks.' },
  { id: 'survival_rations', name: 'Fried Chicken', emoji: '🍗', rarity: 'epic', stat: 'any', bonus: 3, desc: '+3 to ALL stats on next check — Putting the kids working in KFC through higher education.' },

  // AI — risky multiplier
  { id: 'ai_copilot', name: 'AI Copilot', emoji: '🤖', rarity: 'uncommon', stat: 'any', bonus: 0, multiplier: 1.5, desc: '1.5× your stat... or does it?' },
  { id: 'ai_codegen', name: 'AI Code Generator', emoji: '🧠', rarity: 'rare', stat: 'any', bonus: 0, multiplier: 2, desc: '2× your stat... probably' },

  // Substances — risky multipliers
  { id: 'red_bull_espresso', name: 'Red Bull + Espresso', emoji: '⚡', rarity: 'uncommon', stat: 'any', bonus: 0, multiplier: 1.5, desc: '1.5× your stat — The double shot of doom. Heart rate: 180. Code quality: TBD.' },
  { id: 'monster_energy', name: 'Monster Energy', emoji: '👹', rarity: 'rare', stat: 'any', bonus: 0, multiplier: 2, desc: '2× your stat — Green liquid. Green screen of death. Either you ship or you don\'t wake up.' }
];

const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 50,
  uncommon: 30,
  rare: 15,
  epic: 5
};

// Get random equipment item (rarity-weighted)
function getRandomEquipment(): Equipment {
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = RngEngine.random() * totalWeight;
  let selectedRarity = 'common';

  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    roll -= weight;
    if (roll <= 0) {
      selectedRarity = rarity;
      break;
    }
  }

  const pool = EQUIPMENT.filter(item => item.rarity === selectedRarity);
  return pool[Math.floor(RngEngine.random() * pool.length)];
}

// Get 3 random consumables for end-of-run selection
function get3RandomConsumables(): Consumable[] {
  return shuffle(CONSUMABLES).slice(0, CONFIG.game.randomConsumableChoices);
}
