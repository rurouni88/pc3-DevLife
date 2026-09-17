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
Career Phase 1: Junior Developer (Months 1-12)
├── Event: First Code Review (Perception check)
├── Event: Production Incident #1 (Endurance check)
├── Event: Sprint Planning (Charisma check)
├── Event: Learn New Framework (Intelligence check)
├── BOSS: The Legacy Monolith
│
Career Phase 2: Mid-Level Developer (Months 13-36)
├── Event: Cross-Team Architecture Debate
├── Event: Weekend On-Call (Endurance + Luck)
├── Event: Mentor a Junior (Charisma check)
├── Event: Performance Optimization (Strength + Perception)
├── BOSS: The Migration Project
│
Career Phase 3: Senior Developer (Months 37-60)
├── Event: Tech Debt Crisis
├── Event: Interview Panel (Charisma + Luck)
├── Event: Architecture Review Board
├── Event: Burnout Warning Signs (Endurance)
├── BOSS: The Platform Rewrite
│
Career Phase 4: Staff/Principal (Months 61+)
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

Items represent tools, certifications, and resources:

| Item | Effect | Rarity |
|------|--------|--------|
| Mechanical Keyboard | +1 Strength | Common |
| Noise-Canceling Headphones | +1 Endurance | Common |
| Stack Overflow Premium | +1 Luck | Uncommon |
| LeetCode Subscription | +1 Intelligence | Uncommon |
| PMP Certification | +2 Charisma | Rare |
| AWS Certification | +1 Intelligence, +1 Strength | Rare |
| Custom Ergonomic Chair | +2 Endurance | Epic |
| Rubber Duck | +1 Perception | Common |
| Reference Architecture Book | +2 Intelligence | Uncommon |

### 2.5 Career Milestones & Achievements

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
- **Burnout:** Endurance drops to 0 (from events)
- **Terminated:** Failed too many critical checks in a row
- **Imposter Syndrome:** Charisma drops too low (can't function in the industry)
- **Skill Obsolescence:** Intelligence too low, can't learn new tech

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
│   ├── ui.js           # UI rendering
│   └── save.js         # Save/load system
└── assets/
    └── (icons, sounds)
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

Events are defined as JSON objects:

```javascript
{
  id: "incident_001",
  title: "3 AM Production Incident",
  phase: 1, // Career phase 1 = Junior
  narrative: "The pager goes off...",
  choices: [
    {
      text: "Roll back the deployment",
      checks: { Agility: 5 },
      success: { text: "Quick rollback. Team is impressed.", effects: { Agility: 1, Endurance: -1 } },
      failure: { text: "Rollback failed. Situation worsens.", effects: { Endurance: -2, Luck: -1 } }
    },
    {
      text: "Dive into logs",
      checks: { Perception: 6 },
      success: { text: "Found the bug. Clean fix deployed.", effects: { Perception: 1, Intelligence: 1 } },
      failure: { text: "Spent 4 hours looking. It was a DNS issue.", effects: { Endurance: -2 } }
    }
  ]
}
```

---

## 9. Stat Check Resolution

```
1. Calculate effective stat = base_stat + equipment_bonus + temporary_bonus
2. Roll d100 (or d20 for simpler version)
3. Compare against threshold
4. Success if: roll <= (effective_stat * 10) for d100
             or roll <= effective_stat for d20
5. Apply consequences
```

Example: Strength 7 → threshold of 70 on d100 or 7 on d20

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

*Document Version: 1.0*
*Last Updated: 2025*
