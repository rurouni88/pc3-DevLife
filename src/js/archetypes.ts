// Archetypes — predefined starting builds
const ARCHETYPES: Record<string, Archetype> = {
  architect: {
    name: "The Principal Architect",
    description: "High-level design & stakeholder alignment",
    stats: { S: 3, P: 5, E: 5, C: 8, I: 8, A: 6, L: 5 },
  },
  startup: {
    name: "The Rockstar Startup Engineer",
    description: "Ships fast, thrives in chaos",
    stats: { S: 4, P: 4, E: 8, C: 5, I: 6, A: 8, L: 5 },
  },
  systems: {
    name: "The Hardcore Systems Engineer",
    description: "Deep technical, low-level mastery",
    stats: { S: 9, P: 9, E: 5, C: 3, I: 6, A: 4, L: 4 },
  },
  advocate: {
    name: "The Developer Advocate",
    description: "Community builder, fast demos",
    stats: { S: 3, P: 5, E: 5, C: 9, I: 6, A: 7, L: 5 },
  },
  balanced: {
    name: "The Full-Stack Generalist",
    description: "Jack of all trades, master of enough",
    stats: { S: 5, P: 6, E: 6, C: 6, I: 6, A: 6, L: 5 },
  },
  // New archetypes
  sre: {
    name: "The DevOps / SRE Specialist",
    description: "Incident response, on-call survival, production stability",
    stats: { S: 4, P: 9, E: 10, C: 4, I: 6, A: 3, L: 4 },
  },
  pentester: {
    name: "The Cyber Security / Penetration Tester",
    description: "Exploit hunting, breaking things, finding anomalies",
    stats: { S: 3, P: 10, E: 4, C: 3, I: 10, A: 4, L: 6 },
  },
  archeologist: {
    name: "The Legacy Code Archeologist",
    description: "Reading ancient codebases without burning out",
    stats: { S: 9, P: 5, E: 9, C: 2, I: 8, A: 3, L: 4 },
  },
  em: {
    name: "The Engineering Manager",
    description: "People leadership, talent retention, org alignment",
    stats: { S: 2, P: 5, E: 9, C: 10, I: 5, A: 4, L: 5 },
  },
  // Unlockable archetype
  prototype_king: {
    name: "The Prototype King / Hackathon Champion",
    description: "⚠️ UNLOCKED — Lightning-speed prototyping, demo-day legend",
    stats: { S: 2, P: 3, E: 3, C: 5, I: 4, A: 10, L: 10 },
  }
};

// Stat metadata
const STAT_META: Record<StatKey, { name: string; short: string; desc: string; color: string }> = {
  S: {
    name: "Strength",
    short: "Technical Depth & Raw Coding Power",
    desc: "Measures your ability to handle heavy computational workloads and write complex, performant code. High Strength means you can brute-force a massive legacy codebase migration, master complex memory management, and write highly optimized algorithms.",
    color: '#ff6b6b'
  },
  P: {
    name: "Perception",
    short: "Code Comprehension & Debugging",
    desc: "Represents your environmental awareness within a system. High Perception allows you to instantly spot subtle bugs during code reviews, predict system failures before they happen, and easily navigate massive, unfamiliar microservice architectures.",
    color: '#4fc3f7'
  },
  E: {
    name: "Endurance",
    short: "Resilience & Focus",
    desc: "Tracks your stamina for long production outages, on-call rotations, and intense sprint cycles. High Endurance engineers don't burn out easily, can maintain focus during a 10-hour debugging session, and possess the mental fortitude to deal with frustrating, shifting project requirements.",
    color: '#81c784'
  },
  C: {
    name: "Charisma",
    short: "Stakeholder Management & Mentorship",
    desc: "Reflects your ability to influence, persuade, and collaborate. A high score means you excel at cross-team alignment, translating complex tech concepts for non-technical stakeholders, mentoring junior developers, and convincing leadership to fund your proposed architectural changes.",
    color: '#ffab40'
  },
  I: {
    name: "Intelligence",
    short: "System Architecture & Fast Learning",
    desc: "Gauges your capacity to abstract complex problems and learn new frameworks rapidly. High Intelligence engineers design elegant, scalable software architectures, pick up a brand-new programming language over a weekend, and write clean, perfectly decoupled code.",
    color: '#b388ff'
  },
  A: {
    name: "Agility",
    short: "Adaptability & Delivery Velocity",
    desc: "Tracks your speed and execution. High Agility engineers are masters of continuous deployment, rapid prototyping, and pivoting seamlessly when product requirements change. They excel in fast-paced startup environments where shipping code quickly is paramount.",
    color: '#ffd740'
  },
  L: {
    name: "Luck",
    short: "Heuristics & Clean Production Runs",
    desc: "Measures your relationship with the unknown. High Luck engineers write code that 'just works' on the first deploy, guess the exact root cause of a server issue on their first try, and naturally stumble into the easiest, most elegant Stack Overflow solution on page one.",
    color: '#e040fb'
  }
};

// CONFIG.stats.keys is validated at startup; the letters are the stat keys
const STAT_KEYS: StatKey[] = CONFIG.stats.keys;
const STARTING_POINTS = CONFIG.stats.startingPoints;
const MAX_STAT = CONFIG.stats.max;
