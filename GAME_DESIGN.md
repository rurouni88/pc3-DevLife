# DevLife: A Software Engineering Roguelike

## 1. Game Overview

**DevLife** is a web-based roguelike simulation where you play as a software engineer navigating the treacherous landscape of modern tech careers. Each run is a new "career" — a procedurally generated journey through sprints, incidents, code reviews, and career milestones.

**Core Loop:** Make decisions → Manage stats → Survive → Reach retirement or die trying (career suicide).

**Tone:** Satirical, humorous, deeply relatable to any developer who's survived a production outage at 3 AM.

---

## 2. Core Mechanics

### 2.1 The SPECIAL System

| Stat | What It Does | How It's Used |
|------|-------------|---------------|
| **S**trength | Technical depth, raw coding power | Push through impossible deadlines, refactor legacy code, brute-force complex algorithms |
| **P**erception | Code comprehension, bug detection | Spot bugs in code reviews, predict failures, understand unfamiliar codebases |
| **E**ndurance | Stamina, focus, burnout resistance | Survive long on-call rotations, 10-hour debugging marathons, shifting requirements |
| **C**harisma | Stakeholder management, mentorship | Influence decisions, mentor juniors, convince leadership, cross-team alignment |
| **I**ntelligence | System architecture, fast learning | Design scalable systems, learn new frameworks, write clean decoupled code |
| **A**gility | Adaptability, delivery velocity | Ship fast, pivot on requirements, continuous deployment mastery |
| **L**uck | Heuristics, clean production runs | Code "just works" on deploy, lucky guesses, perfect Stack Overflow finds |

**Stat Range:** 1-10 per stat (max 56 total points)  
**Starting Points:** 40 points to distribute (like Fallout's ~40 base points)  
**Gain on Level Up:** +1 to any stat

### 2.2 Career Progression (The "Dungeon")

The game is structured as a series of **Career Phases**, each containing multiple **Events**. Think of it like climbing the tech career ladder — but every step is a gauntlet.

```
Career Phase 1: Junior Developer (Years 1-2)
├── Event: First Code Review (Perception check)
├── Event: Production Incident #1 (Endurance check)
├── Event: Sprint Planning (Charisma check)
├── Event: Learn New Framework (Intelligence check)
├── BOSS: The Legacy Monolith
│
Career Phase 2: Mid-Level Developer (Years 3-5)
├── Event: Cross-Team Architecture Debate
├── Event: Weekend On-Call (Endurance + Luck)
├── Event: Mentor a Junior (Charisma check)
├── Event: Performance Optimization (Strength + Perception)
├── BOSS: The Migration Project
│
Career Phase 3: Senior Developer (Years 6-7)
├── Event: Tech Debt Crisis
├── Event: Interview Panel (Charisma + Luck)
├── Event: Architecture Review Board
├── Event: Burnout Warning Signs (Endurance)
├── BOSS: The Platform Rewrite
│
Career Phase 4: Staff/Principal (Years 8-10)
├── Event: Executive Presentation
├── Event: Open Source Controversy
├── Event: The Great Hiring Freeze
├── Event: Boardroom Strategy Session
└── BOSS: The Company-Wide Restructure
```

### 2.3 Events

Events are the core gameplay unit. Each event presents a scenario with:
- **Narrative description** (satirical tech humor)
- **Multiple choices** (3-4 options)
- **Stat checks** behind each choice (hidden or visible)
- **Consequences** based on checks + choices

**Example Event:**

> **3 AM. The pager goes off.**
> 
> Production database is spiking. Your monitoring dashboard shows a 500% increase in response times. The CEO just pinged you on Slack: "URGENT - CEO here, we're losing $10k/min!"
> 
> What do you do?
> 
> A) **Roll back the last deployment** (Agility check) — Fast, but might lose customer data
> B) **Dive into logs immediately** (Perception check) — Thorough, but takes time
> C) **Call a war room meeting** (Charisma check) — Get everyone aligned, but slow
> D) **Restart everything** (Luck check) — The nuclear option. Works 50% of the time.

### 2.4 Items & Equipment

Passive items that give permanent stat bonuses. **Max 1 equipped at a time.**

#### Common
| Item | Emoji | Effect | Description |
|------|-------|--------|-------------|
| Mechanical Keyboard | ⌨️ | +1 Strength | Clickety-clack. Your fingers never miss. |
| Noise-Canceling Headphones | 🎧 | +1 Endurance | The world fades away. Focus achieved. |
| Rubber Duck | 🦆 | +1 Perception | Debugging companion. It always knows. |
| Ultrawide Monitor | 🖥️ | +1 Perception, +1 Agility | Three screens. Zero distractions. |

#### Uncommon
| Item | Emoji | Effect | Description |
|------|-------|--------|-------------|
| Claude Code | 🤖 | +1 Luck | The AI writes it. You pretend you understand it. |
| System Design Interview Prep | 📊 | +1 Intelligence | You can now draw boxes and arrows confidently. |
| Domain-Driven Design | 📐 | +2 Intelligence | You can now split your monolith into 47 services. |

#### Rare
| Item | Emoji | Effect | Description |
|------|-------|--------|-------------|
| TOGAF Certification | 📜 | +2 Charisma | Enterprise architecture framework. Now you can draw slides about slides. |
| MacBook Pro M5 | 💻 | +1 Intelligence, +1 Agility | It just works. Mostly. |
| AWS Certification | ☁️ | +1 Intelligence, +1 Strength | Cloud-native. Lift heavy things into the sky. |
| Standing Desk | 🪑 | +2 Endurance | Your legs thank you. Your back agrees. |

#### Epic
| Item | Emoji | Effect | Description |
|------|-------|--------|-------------|
| Custom Ergonomic Chair | 💺 | +3 Endurance | Your spine's sanctuary. Worth every penny. |
| Home Office Setup | 🏠 | +1 Perception, +1 Endurance, +1 Agility | The complete package. WFH dreams. |

### 2.5 Consumables

One-time stat boosts for a single event check. **Max 2 in inventory.** Earned on level up — choose from 3 options.

#### Common
| Consumable | Emoji | Effect | Description |
|------------|-------|--------|-------------|
| Vitamin Pill | 💊 | +1 Endurance | Tastes like regret |
| Coffee | ☕ | +2 Endurance | The developer's blood |
| Energy Drink | 🥤 | +2 Agility | Squeeze, swallow, ship |
| Red Bull | 🐂 | +3 Endurance | Gives you wings (and jitters) |
| Instant Noodles | 🍜 | +2 Endurance | 3 minutes to survival. 3 hours to regret. |
| Energy Gel | 🧴 | +2 Agility | Sprint fuel of champions |
| Protein Bar | 🍫 | +1 Endurance | Tastes like cardboard. Works like magic. |
| Cold Pizza | 🍕 | +2 Charisma | The universal developer currency. |

#### Uncommon
| Consumable | Emoji | Effect | Description |
|------------|-------|--------|-------------|
| Focus Session | 🧘 | +3 Perception | See the bugs before they see you |
| Whiteboard Session | 📋 | +3 Intelligence | Architecture clarity |
| Pair Programming | 👥 | +3 Charisma | Two brains, one PR |
| Espresso Shot | ☕ | +3 Perception | One shot. Pure clarity. |
| Matcha Latte | 🍵 | +3 Intelligence | Zen focus for when you need to architect the impossible. |
| Dark Chocolate | 🍫 | +2 Charisma | Share with the team. They'll forgive you for the merge conflict. |
| Pre-Workout | 💪 | +3 Agility, +1 Endurance | Jitters guaranteed. Shipping accelerated. |
| AI Copilot | 🤖 | 1.5× stat (risky!) | 70% chance it works |
| Red Bull + Espresso | ⚡ | 1.5× stat (risky!) | The double shot of doom. Heart rate: 180. Code quality: TBD. |

#### Rare
| Consumable | Emoji | Effect | Description |
|------------|-------|--------|-------------|
| Deep Work Block | 🎯 | +4 Strength | Brute force the codebase |
| Lucky Socks | 🧦 | +4 Luck | First-deploy success |
| Caffeine IV Drip | 💉 | +4 Strength, +3 Endurance | For when coffee just isn't cutting it anymore. |
| Ghost Pepper Hot Sauce | 🌶️ | +4 Agility, -1 Endurance | Fire in your veins. Fire in your gut. Code so fast it burns. |
| Truffle Pasta | 🍝 | +3 Charisma, +2 Luck | The PM actually enjoyed it. Miracles happen. |
| AI Code Generator | 🧠 | 2× stat (very risky!) | Green screen of death |
| Monster Energy | 👹 | 2× stat (very risky!) | Green liquid. Green screen of death. Either you ship or you don't wake up. |

#### Epic
| Consumable | Emoji | Effect | Description |
|------------|-------|--------|-------------|
| Flow State | ⚡ | +5 to ANY stat | Everything clicks |
| The Perfect Meal | 🍱 | +5 to ANY stat | Home-cooked. Made by someone who cares. Everything clicks. |
| Survival Rations | 🎒 | +3 ALL stats (3 events) | MREs from 1998. They taste like betrayal. |

### 2.6 Perks (Stat Mastery)

Maxing a stat (**base value of 10**) unlocks a **Perk** — a permanent, passive ability for the duration of the run. Perks are the reward for investing heavily in a single stat and give each build a distinct "class-like" identity.

#### Rules
- **Trigger:** A perk activates when the **base** stat value reaches 10. Equipment and temporary (consumable) bonuses do **not** count — a +2 equipment bonus on a base-8 stat does not unlock the perk.
- **Duration:** Perks are **per-run**. If a stat drops below 10 (e.g. a −3 Endurance hit), the perk is lost until the stat reaches 10 again. This keeps high stats genuinely valuable late in a run.
- **Multiple perks:** A stat at 10 unlocks exactly one perk. It is possible (rare) to have multiple perks active if multiple stats are at 10.
- **Communication:** A toast notification (`🏅 Perk Unlocked: ...`) fires when a perk activates or deactivates, and active perks are shown as chips in the SPECIAL panel.

#### Perk Table

| Stat | Perk | Effect |
|------|------|--------|
| **S**trength | 💪 **Brute Force** | +2 to the target number on all Strength checks (a target-12 check becomes target-14) |
| **P**erception | 🐛 **Code Review** | Negative stat effects from events are halved (round up) — a −3 hit becomes −2 |
| **E**ndurance | 🧘 **Iron Nerves** | Endurance can never drop below 1 — Burnout game-over is impossible |
| **C**harisma | 🤝 **Negotiate** | Once per run: after any failed stat check, convert it to a success (you talk your way out) |
| **I**ntelligence | 🧠 **Rapid Learner** | +1 bonus point to every level-up allocation |
| **A**gility | 🚀 **Fast Ship** | Bosses appear every 5 events instead of 6 (faster career progression) |
| **L**uck | 🍀 **Clean Deploy** | Equipment drop chance raised from 15% to 25%; AI-consumable backfire chance reduced from 30% to 10% |

#### Design Notes
- Perks only matter at 10, and with 40 starting points spread over 7 stats, maxing a stat at character creation is rare — perks are a mid/late-run goal or a legacy-carry build objective.
- **Fast Ship** (Agility) is the strongest perk because it compounds with everything (more levels, more drops, more events per career). If playtesting shows it is too strong, nerf to: "Bosses every 6 events, but +1 consumable at the end of each phase."
- Future: perks could persist as **legacy unlocks** across runs (meta-progression). The data model should stay open to this (perk state stored per-run, meta storage reserved).

### 2.7 Career Milestones & Achievements

Trackable achievements for replayability:
- 🏆 **Ship It:** Complete 100 deployments
- 💀 **Died by 404:** Failed during the Junior phase
- 🧙 **Full Stack Wizard:** Max out all stats across a single run
- 📉 **Laid Off:** Survive a hiring freeze event
- 🎯 **Perfect Deploy:** Deploy without any issues (Luck check)
- 🐛 **Bug Hunter:** Find and fix 50 bugs in a single run
- 👔 **Corporate Ladder:** Reach Staff/Principal level
- 🤝 **Mentor:** Successfully mentor 10 junior developers

---

## 3. Game Flow

```
START
  ↓
Character Creation (Distribute 40 SPECIAL points)
  ↓
Choose Starting Archetype (or custom)
  ↓
[GAME LOOP]
  ↓
Event Card → Choose Action → Stat Check → Consequence → Gain XP/Items
  ↓
[Check: Career Phase Complete?]
  ↓
[Level Up?] → Gain +1 stat point
  ↓
[Check: Game Over?] → Career Suicide → Game Over screen → Retry
  ↓
[Check: Retirement?] → Victory screen → Career Summary
  ↓
END
```

### Game Over Conditions

**Stat Collapse** — stats are clamped to a floor of **1** (range 1–10). If a stat drops to its floor, the run ends:

| Stat | Condition | Ending |
|------|-----------|--------|
| **S**trength | S ≤ 1 | 💀 Technical Collapse |
| **P**erception | P ≤ 1 | 💀 Lost in the Stack |
| **E**ndurance | E ≤ 1 | 💀 Burnout |
| **C**harisma | C ≤ 1 | 💀 Imposter Syndrome |
| **I**ntelligence | I ≤ 1 *and day > 365* | 💀 Skill Obsolescence |
| **A**gility | A ≤ 1 | 💀 Velocity Zero |
| **L**uck | L ≤ 1 | 💀 Bad Luck Runs Out |

**Made Redundant** — from Phase 3, if Charisma ≤ 2 past day 400, a scaled risk roll can get you axed.

**Terminated** *(planned — not yet implemented)* — fail a threshold number of events in a row and face a 50/50 roll; lose it and you're fired. The allowed failure streak shrinks with seniority: Phase 1 = 5, Phase 2 = 4, Phase 3+ = 3.

### Victory Condition
Reach **Retirement** (complete all Career Phases) OR achieve a personal goal.

---

## 4. Replayability Features

1. **Random Events:** Large pool of events, randomly selected each run
2. **Random Items:** Loot drops from completed events
3. **Random Scenarios:** Same event can have different contexts each run
4. **Multiple Archetypes:** Different starting stat distributions
5. **Permadeath:** Each run is a new career
6. **Meta Progression:** Unlock new event types, items, and archetypes by completing runs
7. **Career Summary:** Detailed stats at end of each run (like roguelike leaderboards)

---

## 5. UI/UX Design

### Layout (Desktop)
```
┌─────────────────────────────────────────────────────────┐
│  DEV LIFE                                                 │
│  Career: Mid-Level Developer  |  Run #3  |  Day: 47      │
├──────────┬───────────────────────────────────────────────┤
│          │                                               │
│ SPECIAL  │           EVENT NARRATIVE                     │
│ Panel    │                                               │
│          │  "3 AM. The pager goes off..."                │
│ S: 7 ─── │                                               │
│ P: 5 ─── │  [Multiple choice buttons]                   │
│ E: 6 ─── │                                               │
│ C: 4 ─── │                                               │
│ I: 8 ─── │                                               │
│ A: 6 ─── │                                               │
│ L: 5 ─── │                                               │
│          │                                               │
│ Level 12 │                                               │
│          │                                               │
│ Items:   │                                               │
│ - Mech   │                                               │
│   Keyboard│                                              │
│ - Head-  │                                               │
│   phones │                                               │
│          │                                               │
│ Log:     │                                               │
│ Day 47:  │                                               │
│ Completed│                                               │
│ Sprint 4 │                                               │
│          │                                               │
└──────────┴───────────────────────────────────────────────┘
```

### Style
- Dark theme (developer aesthetic)
- Monospace fonts for narrative text
- Terminal/IDE-inspired UI elements
- Satirical, dry humor throughout

---

## 6. Technical Architecture (Web Prototype)

### Tech Stack
- **HTML/CSS/JS** (vanilla, no framework for prototype speed)
- **LocalStorage** for save games and meta-progression
- **Single-page application** with hash-based routing

### File Structure
```
pc3-DevLife/
├── index.html          # Main game page
├── css/
│   └── style.css       # Dark terminal theme
├── js/
│   ├── game.js         # Core game engine
│   ├── special.js      # SPECIAL stat system
│   ├── events.js       # Event definitions
│   ├── items.js        # Item definitions
│   ├── archetypes.js   # Starting builds
│   ├── perks.js        # Perk system (stat mastery)
│   ├── ui.js           # UI rendering
│   └── save.js         # Save/load system
└── events/
    ├── phase_junior.json   # 13 events
    ├── phase_mid.json      # 16 events
    ├── phase_senior.json   # 16 events
    └── phase_staff.json    # 12 events
```

---

## 7. Development Phases

### Phase 1: Core Engine (MVP)
- Character creation with SPECIAL distribution
- Basic event system (text + choices)
- Stat check resolution
- One career phase with 5-10 events
- Basic UI layout

### Phase 2: Content Expansion
- All 4 career phases
- 50+ events
- Item system
- Multiple archetypes
- Game over / victory conditions

### Phase 3: Polish & Meta
- Save/load system
- Meta-progression unlocks
- Career summaries
- Achievements
- Sound effects (optional)

### Phase 4: Advanced Features
- Random event generation
- Multi-run leaderboards
- Export/share career runs
- Mobile responsive design

---

## 8. Event System Design

Events are defined as JSON objects (stored in `js/events/phase_*.json`):

```json
{
  "id": "incident_001",
  "title": "3 AM Production Incident",
  "phase": 1,
  "narrative": "The pager goes off...",
  "choices": [
    {
      "text": "Roll back the deployment",
      "checks": { "A": 5 },
      "success": { "text": "Quick rollback. Team is impressed.", "effects": { "A": 1, "E": -1 } },
      "failure": { "text": "Rollback failed. Situation worsens.", "effects": { "E": -2, "L": -1 } }
    },
    {
      "text": "Dive into logs",
      "checks": { "P": 6 },
      "success": { "text": "Found the bug. Clean fix deployed.", "effects": { "P": 1, "I": 1 } },
      "failure": { "text": "Spent 4 hours looking. It was a DNS issue.", "effects": { "E": -2 } }
    }
  ]
}
```

---

## 9. Stat Check Resolution

```
1. Calculate effective stat = base_stat + equipment_bonus + temporary_bonus
2. Compare effective stat against the check threshold
3. Success if: effective_stat >= threshold
4. Apply consequences
```

Example: Strength 7 vs threshold 6 → success (7 >= 6)
         Strength 7 vs threshold 8 → failure (7 < 8)

---

## 10. Satirical Event Examples

### Event: "The Requirements Change"
> Product Manager just walked in. "Hey, small change — can we make the app work offline, support 12 languages, and add a social feed? We need it by Friday."
> 
> A) **Accept and suffer** (Endurance check) — Mental toll but career survival
> B) **Push back with data** (Intelligence + Charisma check) — Risk offending PM
> C) **Scream internally** (Luck check) — Pure survival mode
> D) **Start updating your resume** (Charisma check) — Network for new job

### Event: "The Code Review"
> Your PR has been sitting for 3 days. The senior dev finally commented: "Can you explain your thinking here? And here? And here? Also, have you considered rewriting this in Rust?"
> 
> A) **Defend your architecture** (Charisma check)
> B) **Make the changes** (Endurance check — emotional)
> C) **Ask for specific feedback** (Intelligence check)
> D) **Sulk and ignore** (Luck check — might work, might not)

### Event: "The Demo"
> It's demo day. You've been building this feature for 3 weeks. The executives are watching. Your code works on your machine.
> 
> A) **Pray to the gods of production** (Luck check)
> B) **Have a staging environment ready** (Intelligence check)
> C) **Demo the cool parts, skip the broken parts** (Charisma check)
> D) **Blame the legacy code** (Strength check — emotional endurance)

---

*Document Version: 1.1*
*Last Updated: 2025*
