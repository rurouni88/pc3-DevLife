# DEV LIFE 🖥️💀

> **A Software Engineering Roguelike**  
> *"Ship it. Survive it. Repeat."*

**DevLife** is a browser-based roguelike simulation where you play as a software engineer navigating the treacherous landscape of a modern tech career. Each run is a new career — procedurally generated through sprints, incidents, code reviews, and career milestones.

Will you reach retirement, or will your career end in burnout?

---

## 🎮 How to Play

### Quick Start

1. **Create your engineer** — Distribute 40 points across 7 SPECIAL stats
2. **Choose an archetype** — Or build your own unique developer
3. **Navigate your career** — Make decisions at each event, pass stat checks, survive
4. **Climb the ladder** — Progress through 4 career phases:
   - **Junior Developer** → **Mid-Level Developer** → **Senior Developer** → **Staff/Principal**
5. **Retire or die trying** — Complete all phases to win, or fall victim to burnout, imposter syndrome, or skill obsolescence

### Controls

| Action | How |
|--------|-----|
| Distribute stats | Click `+` / `−` on character creation |
| Apply archetype preset | Click a preset from the dropdown |
| Make a choice | Click one of the choice buttons (A, B, C, D) |
| Use a consumable | Click a consumable button before making a choice |
| View stats/inventory | Click the ☰ menu (mobile) or side panel (desktop) |
| Save game | Click the 💾 button |

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

- **Archetype Presets** — Start as a Principal Architect, Startup Rockstar, SRE Specialist, and more

- **Procedural Events** — Hundreds of satirical tech scenarios: production incidents, code reviews, sprint planning, architecture debates, and more

- **Items & Equipment** — Collect passive stat bonuses from Mechanical Keyboards to Custom Ergonomic Chairs

- **Consumables** — One-time stat boosts like Coffee, Flow State, and risky AI tools (Copilot, Code Generator)

- **Permadeath** — Each run is a new career. Game over means starting fresh.

- **Meta Progression** — Carry consumables between runs, unlock new archetypes

- **Mobile-First Design** — Works great on phones, tablets, and desktops

- **Dark Terminal Theme** — Because that's what real developers use

---

## 🧪 Consumables

Consumables are one-time items that boost a stat for a single check. You can hold **max 2** in your inventory.

| Consumable | Emoji | Effect | Rarity |
|------------|-------|--------|--------|
| Vitamin Pill | 💊 | +1 Endurance | Common |
| Coffee | ☕ | +2 Endurance | Common |
| Energy Drink | 🥤 | +2 Agility | Common |
| Red Bull | 🐂 | +3 Endurance | Common |
| Focus Session | 🧘 | +3 Perception | Uncommon |
| Whiteboard Session | 📋 | +3 Intelligence | Uncommon |
| Pair Programming | 👥 | +3 Charisma | Uncommon |
| Deep Work Block | 🎯 | +4 Strength | Rare |
| Lucky Socks | 🧦 | +4 Luck | Rare |
| Flow State | ⚡ | +5 to ANY stat | Epic |
| AI Copilot | 🤖 | 1.5× stat (risky!) | Uncommon |
| AI Code Generator | 🧠 | 2× stat (very risky!) | Rare |

---

## 📁 File Structure

```
pc3-DevLife/
├── index.html          # Main game page
├── css/
│   └── style.css       # Dark terminal theme
├── js/
│   ├── game.js         # Core game engine & state
│   ├── special.js      # SPECIAL stat system
│   ├── events.js       # Event definitions
│   ├── items.js        # Equipment & consumables
│   ├── archetypes.js   # Starting builds & stat metadata
│   ├── ui.js           # UI rendering & screen management
│   └── save.js         # Save/load system
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

Just open `index.html` in any modern browser:

```bash
# Using Python
python3 -m http.server 8000
# Then open http://localhost:8000

# Or any other local server
npx serve .
```

---

## 🛠️ Tech Stack

- **HTML5 / CSS3 / Vanilla JavaScript** — No frameworks, no build tools
- **LocalStorage** — Save games and meta-progression
- **Single-Page Application** — Screen-based navigation
- **Mobile-First Responsive Design** — Works on all screen sizes

---

## 🎯 Game Over Conditions

| Condition | Cause |
|-----------|-------|
| 💀 **Burnout** | Endurance drops to 0 |
| 💀 **Imposter Syndrome** | Charisma drops too low |
| 💀 **Skill Obsolescence** | Intelligence too low after 365 days |

---

## 🏆 Victory

Complete all **4 career phases** (20+ events) to retire in style. Choose a consumable to carry into your next career!

---

## 📖 Design Document

See [`GAME_DESIGN.md`](GAME_DESIGN.md) for the full game design document, including event examples, stat check mechanics, and development roadmap.

---

## 🧑‍💻 Development

This is a prototype/vertical slice. Planned features:

- [ ] More events per phase (currently ~5-8, target 15+)
- [ ] Boss events at the end of each phase
- [ ] Achievement system
- [ ] Sound effects
- [ ] Animated transitions
- [ ] Export/share career summaries

---

## 📄 License

Private prototype. All rights reserved.

---

*Built with ☕, 💻, and questionable life choices.*
