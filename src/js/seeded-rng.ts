// Seeded random number generator — mulberry32.
// Fast, deterministic, good-enough quality for game use.
// Replaces Math.random() so all dice rolls, shuffles, and loot picks
// can be reproduced from a single 8-character alphanumeric seed.

const SEED_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SEED_LENGTH = 8;

// Convert a string seed to a 32-bit integer for mulberry32.
function seedFromString(seed: string): number {
  let h = 2166136261 >>> 0; // FNV-1a base
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
    h = h >>> 0;
  }
  return h;
}

// Generate a random 8-character alphanumeric seed.
function generateSeed(): string {
  let result = '';
  for (let i = 0; i < SEED_LENGTH; i++) {
    result += SEED_CHARSET[Math.floor(Math.random() * SEED_CHARSET.length)];
  }
  return result;
}

// Mulberry32 PRNG — returns a float in [0, 1).
// Takes a 32-bit integer seed (or a string that is converted).
function createRng(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state |= 0;
    state = state + 0x6D2B79F5 | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Format a number as an 8-char uppercase alphanumeric seed.
function formatSeed(num: number): string {
  let n = num >>> 0;
  let result = '';
  for (let i = 0; i < SEED_LENGTH; i++) {
    result += SEED_CHARSET[n % SEED_CHARSET.length];
    n = Math.floor(n / SEED_CHARSET.length);
  }
  return result;
}

// Parse a formatted seed back to a number.
function parseSeed(seed: string): number {
  let result = 0;
  for (let i = 0; i < seed.length; i++) {
    const idx = SEED_CHARSET.indexOf(seed[i]);
    if (idx === -1) return 0; // invalid character
    result = result * SEED_CHARSET.length + idx;
  }
  return result >>> 0;
}

// The seeded RNG engine. Can be seeded with a string (e.g., "ABC123")
// or left unseeded (uses Math.random() for backwards compat).
// All dice rolls, shuffles, and loot picks go through here so that
// a seeded run is fully reproducible.
const RngEngine = {
  // Current seed string (empty when unseeded).
  seed: '',

  // The current random function — either the seeded PRNG or Math.random.
  _rng: Math.random as () => number,

  // Generate a random 8-char alphanumeric seed.
  generateSeed(): string {
    let result = '';
    for (let i = 0; i < SEED_LENGTH; i++) {
      result += SEED_CHARSET[Math.floor(Math.random() * SEED_CHARSET.length)];
    }
    return result;
  },

  // Seed the RNG with an 8-char alphanumeric string.
  seedWith(seed: string): void {
    this.seed = seed;
    this._rng = createRng(parseSeed(seed));
  },

  // Unseed — fall back to Math.random().
  unseed(): void {
    this.seed = '';
    this._rng = Math.random;
  },

  // Current random number in [0, 1).
  random(): number {
    return this._rng();
  },

  // Generic n-sided die: returns a random integer in [1, sides].
  dRoll(sides: number): number {
    return Math.floor(this.random() * sides) + 1;
  },

  // 20-sided die — stat checks and saving rolls.
  d20(): number { return this.dRoll(20); },

  // Fisher-Yates shuffle: returns a new uniformly shuffled array.
  shuffle<T>(arr: T[]): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  },

  // Parse a formatted seed back to a number.
  parseSeed(seed: string): number {
    return parseSeed(seed);
  },

  // Format a number as an 8-char uppercase alphanumeric seed.
  formatSeed(num: number): string {
    return formatSeed(num);
  },
};
