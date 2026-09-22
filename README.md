# DEV LIFE 🖥️💀

> **A Software Engineering Roguelike**  
> *"Ship it. Survive it. Repeat."*

**DevLife** is a browser-based roguelike simulation where you play as a software engineer navigating the treacherous landscape of a modern tech career. Each run is a new career — procedurally generated through sprints, incidents, code reviews, and career milestones.

Will you reach retirement, or will your career end in burnout?

Click [HERE](https://rurouni88.github.io/pc3-DevLife) to play. 

---

## 🎮 How to Play

### Quick Start

1. **Create your engineer** — Distribute 40 points across 7 SPECIAL stats
2. **Choose an archetype** — Or build your own unique developer
3. **Navigate your career** — Make decisions at each event, pass stat checks, survive
4. **Climb the ladder** — Progress through 4 career phases:
   - **Junior Developer** → **Mid-Level Developer** → **Senior Developer** → **Staff/Principal**
5. **Retire or die trying** — Complete all phases to win, or fall victim to burnout, imposter syndrome, skill obsolescence, or redundancy

### Controls

| Action | How |
|--------|-----|
| Distribute stats | Click `+` / `−` on character creation |
| Apply archetype preset | Click a preset from the dropdown |
| Make a choice | Click one of the choice buttons (A, B, C, D) |
| Use a consumable | Click a consumable button before making a choice |
| Intervene with a perk | Click ⚡ on the result screen (when a perk offers it) |
| View stats/inventory | Click the ☰ menu (mobile) or side panel (desktop) |
| Save game | Click the 💾 button |
| Help | Click the ❓ button for rules, stats, and about |

---

## ⚡ Features

- **SPECIAL Stat System** — 7 stats inspired by Fallout, tailored for dev life:
  - **S**trength — Technical depth & raw coding power
  - **P**erception — Code comprehension & debugging
  - **E**ndurance — Resilience & focus
  - **C**harisma — Stakeholder management & mentorship
  - **I**ntelligence — System architecture & fast learning
  - **A**gility — Adaptability & delivery velocity
  - **L**uck — Heuristics & clean production runs

- **d20 Stat Checks** — Every choice rolls a d20 (modified by Luck) against a target, gated by a competence check so low stats can't muscle past checks far above them

- **Perks (Stat Mastery)** — Max a stat to 10 to unlock a perk: once-per-run interventions (Negotiate, Brute Force, Code Review, Clean Deploy, Iron Nerves) and passive boons (Rapid Learner, Fast Ship)

- **Archetype Presets** — Start as a Principal Architect, Startup Rockstar, SRE Specialist, Penetration Tester, and more

- **Procedural Events** — 57 satirical tech scenarios across 4 career phases: production incidents, code reviews, sprint planning, architecture debates, and more. No event repeats within a run; each phase ends with a boss

- **Items & Equipment** — Collect passive stat bonuses from Mechanical Keyboards to Custom Ergonomic Chairs (rarity-weighted drops, boosted by Luck). Max 1 equipped at a time.

- **Consumables** — One-time stat boosts for a single event check, earned on level up. Max 2 in inventory. Includes food, drinks, and risky AI tools that can backfire.

- **Saving Rolls** — Hit a stat floor and you get a d20 saving throw (Luck + half Charisma) before your career ends

- **Permadeath** — Each run is a new career. Game over means starting fresh.

- **Meta Progression** — Carry your end-of-run equipment and up to 2 consumables into your next career

- **Synthesized Sound Effects** — 8 Web Audio API bleeps (no audio files): success, failure, level up, boss, perk, victory, and more

- **Mobile-First Design** — Works great on phones, tablets, and desktops

- **Dark Terminal Theme** — Because that's what real developers use

---

## 🧪 Consumables

Consumables are one-time stat boosts for a single event check. Hold **max 2** in inventory, earned on level up (pick from 3 options).

See the [full consumables list in GAME_DESIGN.md](GAME_DESIGN.md#25-consumables).

---

## 📁 File Structure

```
pc3-DevLife/
├── index.html          # Main game page
├── css/
│   └── style.css       # Dark terminal theme
├── js/
│   ├── app.js          # Entry point: wiring, career start/continue
│   ├── config.js       # All tunable constants (version, thresholds, rates)
│   ├── game.js         # Core game engine & state
│   ├── special.js      # SPECIAL stat system (base/equipment/temp bonuses)
│   ├── events.js       # Event loading (fetch) & validation
│   ├── events/         # Event content, per career phase
│   │   ├── phase_junior.json   # 13 events (incl. boss)
│   │   ├── phase_mid.json      # 16 events (incl. boss)
│   │   ├── phase_senior.json   # 16 events (incl. boss)
│   │   └── phase_staff.json    # 12 events (incl. boss)
│   ├── items.js        # Equipment & consumables (rarity-weighted)
│   ├── archetypes.js   # Starting builds & stat metadata
│   ├── perks.js        # Perk system (stat mastery)
│   ├── meta.js         # Meta progression (run count, carry-over items)
│   ├── save.js         # Save/load system (localStorage)
│   ├── ui.js           # UI rendering, screens, toasts, sound
│   ├── utils.js        # Shared helpers (d20, day→year)
│   └── types.js        # JSDoc @typedefs (typecheck only, not loaded)
├── test/
│   ├── core.test.js    # Node VM test runner (no framework)
│   └── core.tests.js   # Core game-logic tests
├── .github/workflows/
│   └── ci.yml          # CI: typecheck + test on push/PR
├── package.json        # Scripts: typecheck, test (TypeScript dev dep only)
├── tsconfig.json       # JSDoc/checkJs typecheck config (noEmit)
└── GAME_DESIGN.md      # Full design document
```

---

## 🚀 Deployment

### GitHub Pages (Recommended)

1. Push this repo to GitHub
2. Go to **Settings → Pages → Deploy from a branch**
3. Select `main` branch, root (`/`) folder
4. Your game will be live at:
   ```
   https://<your-username>.github.io/<repo-name>/
   ```

### Local Development

Serve the project over HTTP and open `http://localhost:8000` (opening
`index.html` directly via `file://` won't work — the event files are loaded
with `fetch()`):

```bash
# Using Python
python3 -m http.server 8000

# Or any other local server
npx serve .
```

---

## 🛠️ Tech Stack

- **HTML5 / CSS3 / Vanilla JavaScript** — No frameworks, no build tools
- **TypeScript type checking** — JSDoc annotations + `tsc --noEmit` (no transpilation, no emitted JS)
- **Web Audio API** — 8 synthesized sound effects, no audio files
- **Node VM test suite** — Core game logic tested without a browser or framework
- **LocalStorage** — Save games and meta-progression
- **Single-Page Application** — Screen-based navigation
- **Mobile-First Responsive Design** — Works on all screen sizes

---

## 🎯 Game Over Conditions

Stats have a floor of **1**. When a stat hits its floor you make a **saving roll**: d20 vs **Luck + ½ Charisma**. Fail it and your career is over:

| Condition | Cause |
|-----------|-------|
| 💀 **Technical Obsolescence** | Strength hits 1 |
| 🐛 **Debugging Burnout** | Perception hits 1 |
| 🔥 **Burnout** | Endurance hits 1 (**Iron Nerves**, once per run, can stop it at 3 instead) |
| 📉 **Career Stagnation** | Charisma hits 1 |
| 📚 **Knowledge Decay** | Intelligence hits 1 after day 365 |
| 🐌 **Productivity Cliff** | Agility hits 1 |
| 🍀 **Unlucky Streak** | Luck hits 1 |
| 📉 **Made Redundant** | Phase 3+, after day 400, with Charisma ≤ 2 — a growing chance each event the lower your Charisma |

A successful saving roll bumps every floored stat back up by 1 — barely clinging on.

---

## 🏆 Victory

Defeat the **4 phase bosses** (24 events total — 20 with Fast Ship) to retire in style. Choose a consumable to carry into your next career!

---

## 📖 Design Document

See [`GAME_DESIGN.md`](GAME_DESIGN.md) for the full game design document, including event examples, stat check mechanics, and development roadmap.

There is no traditional hit points (HP) bar. This is a deliberate decision inspired by the things me and some colleagues say:
> My Intelligence just went down after that conversation/decision.

> I no longer have the willpower (Endurance) for this crap.

> We are going to see a decline in Agility because of XXX.

> Ivory Tower Architects. Too high from the front lines. They don't see what it's like down here. (Implies Perception loss)

> We have been saying that for years, but bring in/pay for an external consultant (eg. McKinsey), and the executives listen. (External consultants tend to have higher charisma)

If anyone is genuinely offended or butt-hurt by this, I will go on record and say:

> Too bad, too sad. I apologise to absolutely nobody. This is my personal lived-in experience in this field.

---

## 🧑‍💻 Development

### Building & verifying

DevLife is a static site — there is **no build step** and nothing to compile.
The files in this repo are exactly what gets served. The only tooling is a
type checker (guards the shared data shapes: game state, events, items) and
a core-logic test suite:

```bash
npm install        # installs TypeScript (dev dependency only)
npm run typecheck  # runs tsc --noEmit; reports errors, emits nothing
npm test           # runs the core game-logic tests (Node, no framework)
```

- Type definitions live in [`js/types.js`](js/types.js) (JSDoc `@typedef`s only — no runtime code, not loaded by the browser).
- Annotations are plain JSDoc comments in the existing `.js` files; the game runs identically with or without them.
- Tests live in [`test/`](test/): the logic modules (`config`, `utils`, `items`, `special`, `perks`, `game`) run in a Node VM context with stubbed browser globals, so the rules (stat checks, perk activation and grace rules, equipment drops, carry-over) are verified without a browser.
- CI (`.github/workflows/ci.yml`) runs both `npm run typecheck` and `npm test` on every push to `main` and on all pull requests (Node 20, two jobs).

### Roadmap

This is a prototype/vertical slice. Planned features:

- [ ] Achievement system
- [ ] Animated transitions
- [ ] More events (50+ per phase)
- [ ] Export/share career summaries

Current state:
- 57 events across 4 career phases (13–16 per phase)
- Boss events ending each phase ✓
- d20 stat checks with competence gate and saving rolls ✓
- Perk system with once-per-run interventions ✓
- Meta progression: carry equipment/consumables between runs ✓
- Synthesized sound effects ✓

---

## 🙏 Credits

**SPECIAL stat system** inspired by [Fallout](https://fallout.fandom.com/wiki/SPECIAL) by Interplay Productions / Black Isle Studios. The seven stats (Strength, Perception, Endurance, Charisma, Intelligence, Agility, Luck) are a loving homage to the classic RPG system, reimagined for the modern software engineering career.

**Game Inspiration** Did some training and had conversations where the general feel was how charismatic the trainer is.
> If people had stats, he'd be a 10 for Charisma.

> If I had his charisma, I'd could be a CEO.

> But we are all SPECIAL in our own ways.

And this is how we got here today. (Also, I've logged too many hours in Fallout in my younger years.)

## 📄 License

MIT License

Copyright (c) 2026 PC3 Enterprises

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

*Built with ☕, 💻, and questionable life choices.*
