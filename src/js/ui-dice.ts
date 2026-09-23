// UI — animated d20 dice roll.
// Presentation tier: owns the SVG dice, animation, and overlay.
// Triggered by game checks; shows cycling animation then settles on the roll.

// Create the SVG d20 (icosahedron projection) with a number overlay.
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
    const [x1, y1, x2, y2] = pts.split(' ').map(Number);
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

// Animate a d20 roll: cycle through random values then settle on the final result.
function animateDiceRoll(finalValue: number, callback: (value: number) => void): void {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.classList.add('dice-overlay');
  document.body.appendChild(overlay);

  // Create dice
  const dice = createDiceSVG(1);
  overlay.appendChild(dice);

  // Animation parameters
  const totalDuration = 800; // ms
  const cycleCount = 15; // number of random values before settling
  const startTime = performance.now();

  // Animation loop
  function tick(now: number): void {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / totalDuration, 1);

    // Calculate which value to show
    const valueIndex = Math.floor(progress * cycleCount);
    const currentValue = valueIndex >= cycleCount ? finalValue : Math.floor(Math.random() * 20) + 1;

    // Update the SVG text
    const textEl = dice.querySelector('.d20-value');
    if (textEl) textEl.textContent = String(currentValue);

    // Add shake effect based on progress
    const shake = (1 - progress) * 4;
    const rx = (Math.random() - 0.5) * shake;
    const ry = (Math.random() - 0.5) * shake;
    dice.style.transform = `rotate(${rx}deg) translate(${ry}px, ${ry * 0.5}px)`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      // Final value with settle effect
      dice.style.transform = 'rotate(0deg) scale(1.2)';
      setTimeout(() => {
        dice.style.transform = 'rotate(0deg) scale(1)';
        setTimeout(() => {
          overlay.remove();
          callback(finalValue);
        }, 200);
      }, 100);
    }
  }

  requestAnimationFrame(tick);
}

// Check if a dice animation is currently running.
let diceAnimating = false;

// Show a d20 dice animation for a specific roll value.
// Triggers the animation and calls callback when done.
function showDiceRoll(value: number, callback?: () => void): void {
  if (diceAnimating) return;
  diceAnimating = true;
  animateDiceRoll(value, () => {
    diceAnimating = false;
    callback?.();
  });
}

const UIDice = {
  showDiceRoll,
  animateDiceRoll,
  createDiceSVG,
  get isAnimating(): boolean { return diceAnimating; },
};
