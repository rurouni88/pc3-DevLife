// UI — animated d20 dice roll.
// Presentation tier: owns the SVG dice, animation, and overlay.
// Triggered by game checks; shows cycling animation then settles on the roll.

// Create the SVG d20 (icosahedron projection) with a number overlay.
import { CONFIG } from '../core/config.js';


function createDiceSVG(value: number): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 120');
  svg.setAttribute('width', '100');
  svg.setAttribute('height', '120');
  svg.classList.add('d20-dice');

  // Icosahedron shape (2D projection)
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('points', '50,5 95,35 95,85 50,115 5,85 5,35');
  polygon.setAttribute('fill', 'var(--bg-tertiary)');
  polygon.setAttribute('stroke', 'var(--accent-yellow)');
  polygon.setAttribute('stroke-width', '3');
  polygon.classList.add('d20-shape');
  svg.appendChild(polygon);

  // Inner lines for 3D effect
  const lines = [
    '50,5 50,115',
    '5,35 95,85',
    '95,35 5,85',
    '50,5 5,35',
    '50,5 95,35',
    '5,35 5,85',
    '95,35 95,85',
    '5,85 50,115',
    '95,85 50,115',
  ];
  for (const pts of lines) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    // Each entry is "x1,y1 x2,y2" — split into two points, then into coords.
    const [from, to] = pts.split(' ');
    const [x1, y1] = from.split(',').map(Number);
    const [x2, y2] = to.split(',').map(Number);
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', 'var(--accent-yellow)');
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('opacity', '0.5');
    svg.appendChild(line);
  }

  // Value text
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', '50');
  text.setAttribute('y', '65');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dominant-baseline', 'central');
  text.setAttribute('font-family', 'var(--font-mono)');
  text.setAttribute('font-size', '32');
  text.setAttribute('font-weight', 'bold');
  text.setAttribute('fill', 'var(--text-primary)');
  text.textContent = String(value);
  text.classList.add('d20-value');
  svg.appendChild(text);

  return svg;
}

// One die's outcome: the d20 face to settle on, and whether the check passed.
// success drives the pass/fail border colour shown once the die settles.
interface DiceRoll {
  roll: number;
  success: boolean;
}

// Animate one or more d20 rolls: cycle through random values then settle each
// die on its final face. Multi-check choices show one die per check, stacked
// top-to-bottom, so the player sees every roll on a single screen.
function animateDiceRoll(rolls: DiceRoll[], callback?: (rolls: DiceRoll[]) => void): void {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.classList.add('dice-overlay');
  document.body.appendChild(overlay);

  // Dice stack: one die per check, laid out vertically.
  const stack = document.createElement('div');
  stack.className = 'dice-stack';
  overlay.appendChild(stack);

  const dice = rolls.map(() => {
    const d = createDiceSVG(1);
    stack.appendChild(d);
    return d;
  });

  // Animation parameters (see CONFIG.dice)
  const totalDuration = CONFIG.dice.rollDurationMs;
  const cycleCount = CONFIG.dice.cycleCount;
  const startTime = performance.now();

  // Animation loop
  function tick(now: number): void {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / totalDuration, 1);
    const settled = progress >= 1;

    dice.forEach((die, i) => {
      const currentValue = settled ? rolls[i].roll : Math.floor(Math.random() * 20) + 1;
      const textEl = die.querySelector('.d20-value');
      if (textEl) textEl.textContent = String(currentValue);

      // Shake while cycling, still when settled
      const shake = (1 - progress) * 4;
      const rx = (Math.random() - 0.5) * shake;
      const ry = (Math.random() - 0.5) * shake;
      die.style.transform = `rotate(${rx}deg) translate(${ry}px, ${ry * 0.5}px)`;
    });

    if (!settled) {
      requestAnimationFrame(tick);
    } else {
      // Settle: colour each die's border by pass/fail (visual affirmation),
      // then hold the result on screen before clearing.
      dice.forEach((die, i) => {
        die.style.transform = 'rotate(0deg) scale(1.2)';
        die.classList.add(rolls[i].success ? 'pass' : 'fail');
      });
      setTimeout(() => {
        dice.forEach(die => { die.style.transform = 'rotate(0deg) scale(1)'; });
        setTimeout(() => {
          overlay.remove();
          callback?.(rolls);
        }, CONFIG.dice.resultHoldMs);
      }, 100);
    }
  }

  requestAnimationFrame(tick);
}

// Check if a dice animation is currently running.
let diceAnimating = false;

// Show a d20 dice animation for one or more rolls (raw d20 face + pass/fail).
// A single-element array renders one die; multiple render a vertical stack.
// Triggers the animation and calls callback when done.
function showDiceRoll(rolls: DiceRoll[], callback?: () => void): void {
  if (diceAnimating) return;
  diceAnimating = true;
  animateDiceRoll(rolls, () => {
    diceAnimating = false;
    callback?.();
  });
}

export const UIDice = {
  showDiceRoll,
  animateDiceRoll,
  createDiceSVG,
  get isAnimating(): boolean { return diceAnimating; },
};
