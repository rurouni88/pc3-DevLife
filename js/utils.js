// utils.js — shared helpers (dice rolls)

// Generic n-sided die: returns a random integer in [1, sides].
function dRoll(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

// 20-sided die — stat checks and saving rolls.
function d20() { return dRoll(20); }

