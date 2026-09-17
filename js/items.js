// Equipment — passive items with permanent stat bonuses
const EQUIPMENT = [
  // Common
  { id: 'keyboard', name: 'Mechanical Keyboard', emoji: '⌨️', rarity: 'common', effects: { S: 1 }, desc: '+1 Strength' },
  { id: 'headphones', name: 'Noise-Canceling Headphones', emoji: '🎧', rarity: 'common', effects: { E: 1 }, desc: '+1 Endurance' },
  { id: 'duck', name: 'Rubber Duck', emoji: '🦆', rarity: 'common', effects: { P: 1 }, desc: '+1 Perception' },
  { id: 'monitor', name: 'Ultrawide Monitor', emoji: '🖥️', rarity: 'common', effects: { P: 1, A: 1 }, desc: '+1 Perception, +1 Agility' },
  
  // Uncommon
  { id: 'stackoverflow', name: 'Stack Overflow Premium', emoji: '🌟', rarity: 'uncommon', effects: { L: 1 }, desc: '+1 Luck' },
  { id: 'leetcode', name: 'LeetCode Subscription', emoji: '📚', rarity: 'uncommon', effects: { I: 1 }, desc: '+1 Intelligence' },
  { id: 'architecture', name: 'Reference Architecture Book', emoji: '📖', rarity: 'uncommon', effects: { I: 2 }, desc: '+2 Intelligence' },
  
  // Rare
  { id: 'pmp', name: 'PMP Certification', emoji: '📜', rarity: 'rare', effects: { C: 2 }, desc: '+2 Charisma' },
  { id: 'aws', name: 'AWS Certification', emoji: '☁️', rarity: 'rare', effects: { I: 1, S: 1 }, desc: '+1 Intelligence, +1 Strength' },
  { id: 'standing', name: 'Standing Desk', emoji: '🪑', rarity: 'rare', effects: { E: 2 }, desc: '+2 Endurance' },
  
  // Epic
  { id: 'chair', name: 'Custom Ergonomic Chair', emoji: '💺', rarity: 'epic', effects: { E: 3 }, desc: '+3 Endurance' },
  { id: 'homeoffice', name: 'Home Office Setup', emoji: '🏠', rarity: 'epic', effects: { P: 1, E: 1, A: 1 }, desc: '+1 Perception, +1 Endurance, +1 Agility' }
];

// Consumables — one-time use items that boost a specific stat for a check
const CONSUMABLES = [
  { id: 'coffee', name: 'Coffee', emoji: '☕', rarity: 'common', stat: 'E', bonus: 2, desc: '+2 Endurance on next check' },
  { id: 'energy_drink', name: 'Energy Drink', emoji: '🥤', rarity: 'common', stat: 'A', bonus: 2, desc: '+2 Agility on next check' },
  { id: 'redbull', name: 'Red Bull', emoji: '🐂', rarity: 'common', stat: 'E', bonus: 3, desc: '+3 Endurance on next check' },
  { id: 'vitamin', name: 'Vitamin Pill', emoji: '💊', rarity: 'common', stat: 'E', bonus: 1, desc: '+1 Endurance on next check' },
  { id: 'focus', name: 'Focus Session', emoji: '🧘', rarity: 'uncommon', stat: 'P', bonus: 3, desc: '+3 Perception on next check' },
  { id: 'whiteboard', name: 'Whiteboard Session', emoji: '📋', rarity: 'uncommon', stat: 'I', bonus: 3, desc: '+3 Intelligence on next check' },
  { id: 'pair_program', name: 'Pair Programming', emoji: '👥', rarity: 'uncommon', stat: 'C', bonus: 3, desc: '+3 Charisma on next check' },
  { id: 'deep_work', name: 'Deep Work Block', emoji: '🎯', rarity: 'rare', stat: 'S', bonus: 4, desc: '+4 Strength on next check' },
  { id: 'lucky_charm', name: 'Lucky Socks', emoji: '🧦', rarity: 'rare', stat: 'L', bonus: 4, desc: '+4 Luck on next check' },
  { id: 'flow_state', name: 'Flow State', emoji: '⚡', rarity: 'epic', stat: 'any', bonus: 5, desc: '+5 to ANY stat on next check' },
  
  // AI — risky multiplier
  { id: 'ai_copilot', name: 'AI Copilot', emoji: '🤖', rarity: 'uncommon', stat: 'any', bonus: 0, multiplier: 1.5, desc: '1.5× your stat... or does it?' },
  { id: 'ai_codegen', name: 'AI Code Generator', emoji: '🧠', rarity: 'rare', stat: 'any', bonus: 0, multiplier: 2, desc: '2× your stat... probably' }
];

const RARITY_WEIGHTS = {
  common: 50,
  uncommon: 30,
  rare: 15,
  epic: 5
};

// Get random equipment item
function getRandomEquipment() {
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  let selectedRarity = 'common';
  
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    roll -= weight;
    if (roll <= 0) {
      selectedRarity = rarity;
      break;
    }
  }
  
  const pool = EQUIPMENT.filter(item => item.rarity === selectedRarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

// Get random consumable
function getRandomConsumable() {
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  let selectedRarity = 'common';
  
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    roll -= weight;
    if (roll <= 0) {
      selectedRarity = rarity;
      break;
    }
  }
  
  const pool = CONSUMABLES.filter(item => item.rarity === selectedRarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

// Get 3 random consumables for end-of-run selection
function get3RandomConsumables() {
  const all = [...CONSUMABLES];
  const shuffled = all.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}
