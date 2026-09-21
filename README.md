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
├── index.html          # Main game page (loads the built JS from dist/)
├── css/
│   └── style.css       # Dark terminal theme
├── js/                 # TypeScript source (compiled to dist/js/ by tsc)
│   ├── app.ts          # Entry point: wiring, career start/continue
│   ├── config.ts       # All tunable constants (version, thresholds, rates)
│   ├── game.ts         # Core game engine & state
│   ├── special.ts      # SPECIAL stat system (base/equipment/temp bonuses)
│   ├── events.ts       # Event loading (fetch) & validation
│   ├── events/         # Event content, per career phase (fetched at runtime)
│   │   ├── phase_junior.json   # 13 events (incl. boss)
│   │   ├── phase_mid.json      # 16 events (incl. boss)
│   │   ├── phase_senior.json   # 16 events (incl. boss)
│   │   └── phase_staff.json    # 12 events (incl. boss)
│   ├── items.ts        # Equipment & consumables (rarity-weighted)
│   ├── archetypes.ts   # Starting builds & stat metadata
│   ├── perks.ts        # Perk system (stat mastery)
│   ├── meta.ts         # Meta progression (run count, carry-over items)
│   ├── save.ts         # Save/load system (localStorage)
│   ├── ui.ts           # UI core: screens, toasts, sound, event/result rendering
│   ├── ui-character.ts # UI: character creation & stat allocation
│   ├── ui-levelup.ts   # UI: level-up (stat + consumable) selection
│   ├── ui-endofrun.ts  # UI: end-of-run / victory consumable selection
│   ├── utils.ts        # Shared helpers (d20, day→year)
│   └── types.ts        # Shared types (interfaces — no runtime code)
├── dist/               # Build output (gitignored; generated by npm run build)
│   ├── index.html      # Assembled copy (script srcs point at js/)
│   ├── css/            # Copied from css/
│   └── js/             # Compiled JS + copied event JSON
├── scripts/
│   └── assemble-dist.js  # Copies index.html/css/events into dist/ for deployment
├── test/
│   ├── core.test.js    # Node VM test runner (loads the built dist/js/)
│   └── core.tests.js   # Core game-logic tests
├── .github/workflows/
│   ├── ci.yml          # CI: typecheck + test on push/PR
│   └── pages.yml       # Deploy: build + upload dist/ to GitHub Pages
├── package.json        # Scripts: build, assemble, dev, test, typecheck
├── tsconfig.json       # Type-checker config (strict, noEmit)
├── tsconfig.build.json # Build config (extends tsconfig, emits to dist/)
└── GAME_DESIGN.md      # Full design document
```

---

## 🚀 Deployment

### GitHub Pages (Recommended)

The site is built before it's served: `tsc` compiles the TypeScript to plain
JS in `dist/`, and `assemble-dist.js` adds `index.html`, `css/`, and the event
JSON. A GitHub Actions workflow (`.github/workflows/pages.yml`) runs this build
and uploads the finished `dist/` to GitHub Pages on every push to `main`.

To enable it (one-time):
1. Push this repo to GitHub
2. Go to **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**
3. Push to `main` — the workflow builds and deploys automatically
4. Your game will be live at:
   ```
   https://<your-username>.github.io/<repo-name>/
   ```

### Local Development

Build the TypeScript first, then serve the project root over HTTP (opening
`index.html` directly via `file://` won't work — the event files are loaded
with `fetch()`):

```bash
npm install      # installs TypeScript (dev dependency only)
npm run dev      # build and watch (rebuilds on save) — or: npm run build
```

Then serve and open `http://localhost:8000`:

```bash
python3 -m http.server 8000    # or: npx serve .
```

---

## 🛠️ Tech Stack

- **HTML5 / CSS3 / TypeScript** — No frameworks; a `tsc` build step compiles the TS source to plain, module-free JS in `dist/`
- **TypeScript** — Full `strict` type checking + a build step (`tsc`) that emits plain JS (no bundler, `file://`-safe)
- **Web Audio API** — 8 synthesized sound effects, no audio files
- **Node VM test suite** — Core game logic tested against the built output, without a browser or framework
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

DevLife is a static site with a single build step: `tsc` compiles the
TypeScript source in `js/` to plain, module-free JavaScript in `dist/`. The
browser and the tests both load the built output, so you always verify what
ships:

```bash
npm install          # installs TypeScript (dev dependency only)
npm run dev          # build and watch (rebuilds on save) — for local development
npm run build        # one-off build to dist/
npm run assemble     # add index.html, css/, and event JSON to dist/ (for deployment)
npm run typecheck    # type-check without emitting
npm test             # build, then run the core game-logic tests against dist/
```

- The source is TypeScript (`js/*.ts`) under full `strict` checking; [`js/types.ts`](js/types.ts) holds the shared types (interfaces — no runtime code).
- [`tsconfig.json`](tsconfig.json) is the type-checker config (`noEmit`); [`tsconfig.build.json`](tsconfig.build.json) extends it to emit to `dist/`.
- The emitted JS is plain scripts (no `import`/`export`), so the game needs no bundler and still works from `file://`.
- Tests live in [`test/`](test/): the logic modules run in a Node VM context with stubbed browser globals, loaded from the **built** `dist/js/`, so the rules (stat checks, perk activation and grace rules, equipment drops, carry-over) are verified against exactly what ships.
- CI (`.github/workflows/ci.yml`) runs `npm run typecheck` and `npm test` on every push to `main` and on all pull requests (Node 20, two jobs).
- Deployment (`.github/workflows/pages.yml`) builds the site and uploads `dist/` to GitHub Pages on every push to `main`.

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
