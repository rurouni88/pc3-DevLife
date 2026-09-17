// Events — the core content of the game
// Each event has choices with stat checks and consequences

const EVENTS = [
  // ===== Phase 1: Junior Developer =====
  {
    id: 'first_code_review',
    title: 'First Code Review',
    phase: 1,
    phaseLabel: 'Junior Developer — Month 1',
    narrative: `You've written your first meaningful feature. It works on your machine. You submit the pull request and wait.\n\nTwo hours later, your senior dev comments: "Can you explain why you chose this approach? Also, have you considered edge cases? And can we add a unit test for the happy path?"\n\nYour heart sinks.`,
    choices: [
      {
        text: 'Defend your architecture confidently',
        checks: { C: 6 },
        success: { text: 'You explain your reasoning clearly. The senior dev is impressed and approves the PR. "Good thinking!" they write.', effects: { C: 1, I: 1 }, log: 'First code review — passed with flying colors!' },
        failure: { text: 'You stammer through your explanation. The PR gets sent back with 12 more comments.', effects: { E: -1 }, log: 'First code review — painful.' }
      },
      {
        text: 'Make all the changes silently',
        checks: { E: 4 },
        success: { text: 'You fix everything they asked for. It\'s tedious but you learn a lot. PR approved.', effects: { P: 1 }, log: 'Fixed all code review comments.' },
        failure: { text: 'You fix the obvious ones but miss the deeper issues. Second round of reviews.', effects: { E: -1, P: -1 }, log: 'Missed some review comments.' }
      },
      {
        text: 'Ask for a 1:1 walkthrough instead',
        checks: { C: 5 },
        success: { text: 'Great idea! You both hop on a call. They explain their concerns and you learn tons. PR approved.', effects: { C: 2, P: 1 }, log: 'Smart move — learned a lot in 1:1.' },
        failure: { text: 'They\'re busy and say "just comment on the PR." You\'re back to square one.', effects: {}, log: '1:1 request declined.' }
      }
    ]
  },
  {
    id: 'production_incident_1',
    title: '3 AM Production Incident',
    phase: 1,
    phaseLabel: 'Junior Developer — Month 2',
    narrative: `The pager goes off. It\'s 3:17 AM.\n\nProduction database is spiking. Response times are up 500%. Your monitoring dashboard looks like a stock market crash. The CEO just pinged you on Slack: "URGENT - CEO here, we're losing $10k/min!"\n\nYou\'re on call this week. Good luck.`,
    choices: [
      {
        text: 'Roll back the last deployment',
        checks: { A: 5 },
        success: { text: 'Quick rollback. The site stabilizes within minutes. The team is relieved. "Nice save!" says your manager.', effects: { A: 1, E: -1 }, log: 'Solved first production incident!' },
        failure: { text: 'Rollback didn\'t help — the bug was in the data, not the code. Now you really need to dig in...', effects: { E: -2, A: -1 }, log: 'Rollback failed. Crisis worsens.' }
      },
      {
        text: 'Dive into logs immediately',
        checks: { P: 6 },
        success: { text: 'You spot the anomalous query pattern. It\'s an unoptimized JOIN on a massive table. You fix it and deploy. Solved!', effects: { P: 2, I: 1 }, log: 'Found the bug through careful log analysis.' },
        failure: { text: 'You spend 4 hours looking. It turns out to be a DNS issue. The network team had it fixed 2 hours ago.', effects: { E: -2 }, log: 'Spent hours debugging. It was DNS.' }
      },
      {
        text: 'Call a war room meeting',
        checks: { C: 4 },
        success: { text: 'You rally the team. Everyone pitches in. The senior dev finds the issue within 30 minutes. You learn by osmosis.', effects: { C: 1, E: -1 }, log: 'Led the war room effort.' },
        failure: { text: 'Everyone\'s asleep. You get 2 people online and waste an hour trying to coordinate. The senior dev finally joins and fixes it.', effects: { E: -2 }, log: 'War room was chaos.' }
      },
      {
        text: 'Restart everything',
        checks: { L: 7 },
        success: { text: 'Miraculously, restarting the services clears the memory leak. It\'s a temporary fix but buys time. You\'re a hero (for now).', effects: { L: 1, A: 1 }, log: 'Nuclear option worked... somehow.' },
        failure: { text: 'The restart makes it worse. The database goes down completely. It\'s been 6 hours and things are still broken.', effects: { E: -3, L: -1 }, log: 'Restart made everything worse. 💀' }
      }
    ]
  },
  {
    id: 'sprint_planning',
    title: 'Sprint Planning',
    phase: 1,
    phaseLabel: 'Junior Developer — Month 3',
    narrative: `Sprint planning meeting. The PM presents the backlog: 47 story points of work for a 2-week sprint. The team\'s velocity is about 30 points.\n\n"Can we fit all of this in?" the PM asks hopefully.\n\nYour team lead looks at you. "What do you think?"`,
    choices: [
      {
        text: 'Speak up about capacity',
        checks: { C: 5 },
        success: { text: 'You present data about your team\'s velocity. The PM understands and prioritizes. Realistic scope set.', effects: { C: 1, I: 1 }, log: 'Used data to set realistic expectations.' },
        failure: { text: 'You stammer through your numbers. The PM says "I\'ll just ask the team to work harder." Everyone groans.', effects: { E: -1 }, log: 'Failed to push back effectively.' }
      },
      {
        text: 'Stay silent and take on more work',
        checks: { E: 5 },
        success: { text: 'You swallow your pride and volunteer for extra tasks. The sprint is stressful but you deliver.', effects: { E: 1, A: 1 }, log: 'Took on extra work. Sprint completed.' },
        failure: { text: 'You take on too much. You burn through your first week and have barely made progress. Overtime city.', effects: { E: -2 }, log: 'Overcommitted. Sprint struggling.' }
      }
    ]
  },
  {
    id: 'learn_new_framework',
    title: 'The New Framework Mandate',
    phase: 1,
    phaseLabel: 'Junior Developer — Month 4',
    narrative: `Your company just decided to rewrite everything in a brand new framework that\'s 3 weeks old. The CTO announced it at all-hands: "This is the future. Everyone needs to learn it by end of quarter."\n\nThe framework has 200 GitHub stars and documentation that says "WIP."\n\nYour current project uses the OLD framework.`,
    choices: [
      {
        text: 'Dive deep — build a prototype over the weekend',
        checks: { I: 7 },
        success: { text: 'You\'re a natural. The framework\'s design philosophy clicks with you. You build an impressive demo that impresses the CTO.', effects: { I: 2, C: 1 }, log: 'Learned the new framework over the weekend.' },
        failure: { text: 'The framework is poorly designed. Your prototype breaks. You spend the weekend frustrated and sleep-deprived.', effects: { E: -2, I: 1 }, log: 'Weekend spent fighting a bad framework.' }
      },
      {
        text: 'Study it methodically during work hours',
        checks: { A: 5 },
        success: { text: 'You\'re patient and thorough. By week 3, you\'re the team\'s go-to person for framework questions.', effects: { I: 1, A: 1 }, log: 'Methodically learned the new framework.' },
        failure: { text: 'Work piles up while you study. Your current project slips. You\'re learning the framework but falling behind.', effects: { E: -1 }, log: 'Learning slowed down current work.' }
      },
      {
        text: 'Find the community Discord and ask questions',
        checks: { C: 5 },
        success: { text: 'You network with other adopters. Someone shares a tutorial that accelerates your learning 10x.', effects: { C: 2, I: 1 }, log: 'Community knowledge accelerated learning.' },
        failure: { text: 'The Discord is dead. Only 3 people are active. Nobody can help you.', effects: { L: -1 }, log: 'Community was a ghost town.' }
      }
    ]
  },
  {
    id: 'the_legacy_monolith',
    title: 'BOSS: The Legacy Monolith',
    phase: 1,
    phaseLabel: 'Junior Developer — Boss Battle',
    narrative: `Your first BOSS fight. You\'ve been assigned to the "legacy codebase" — a 15-year-old application with no tests, no documentation, and 47 different developers who all touched the same file.\n\nThe codebase is written in 3 different languages. The build script requires a specific version of Node that was released in 2014.\n\nYour mission: Add a simple "export to CSV" feature without breaking anything.\n\nThe monolith stirs.`,
    choices: [
      {
        text: 'Brute force it — read the code and hack it in',
        checks: { S: 7, P: 6 },
        success: { text: 'You power through the spaghetti code. It\'s painful but you find a way. The feature works. The monolith groans in submission.', effects: { S: 2, P: 1 }, log: 'Defeated the Legacy Monolith! 🏆' },
        failure: { text: 'You break 3 unrelated features. The monolith fights back. Your manager assigns a senior dev to fix your mess.', effects: { S: -1, E: -2 }, log: 'The monolith won. 💀' }
      },
      {
        text: 'Write tests first, then refactor incrementally',
        checks: { I: 8 },
        success: { text: 'You\'re patient. You write tests, understand the code, and add the feature safely. It takes 3 weeks but it\'s clean.', effects: { I: 2, P: 1 }, log: 'Systematically conquered the monolith.' },
        failure: { text: 'The code is too tangled to test reliably. Your tests are all flaky. You\'re stuck.', effects: { E: -2 }, log: 'Tests couldn\'t tame the monolith.' }
      },
      {
        text: 'Ask the senior dev who wrote this thing',
        checks: { C: 6 },
        success: { text: 'The senior dev remembers! They draw a diagram on a whiteboard. Everything clicks. You implement it in 2 days.', effects: { C: 2, I: 1 }, log: 'Knowledge transfer saved the day!' },
        failure: { text: 'The senior dev quit 2 years ago. Nobody knows how this works. You\'re truly on your own.', effects: { L: -1 }, log: 'Nobody knows the legacy code.' }
      }
    ]
  },
  
  // ===== Phase 2: Mid-Level Developer =====
  {
    id: 'weekend_oncall',
    title: 'Weekend On-Call',
    phase: 2,
    phaseLabel: 'Mid-Level Developer — Month 14',
    narrative: `You\'re on weekend on-call. It\'s Saturday afternoon. You\'re at a BBQ. Your phone buzzes.\n\n"A user can\'t log in." Minor issue. Probably nothing.\n\nYou ignore it. 20 minutes later, the monitoring dashboard lights up red. It\'s not just one user. It\'s ALL users.\n\nYour BBQ is about to become a war room.`,
    choices: [
      {
        text: 'Drop everything and remote in',
        checks: { E: 7 },
        success: { text: 'You remote in during the BBQ. It was a bad deploy. You fix it in 15 minutes. Everyone at the BBQ is impressed by your dedication (and slightly concerned).', effects: { E: 1, A: 1 }, log: 'Solved login crisis from a BBQ.' },
        failure: { text: 'You\'re distracted by the BBQ. It takes 2 hours to notice and fix. The VP of Sales was one of the affected users.', effects: { E: -2, C: -1 }, log: 'Took too long to respond.' }
      },
      {
        text: 'Call the team lead',
        checks: { C: 5 },
        success: { text: 'The team lead jumps in while you\'re at the BBQ. They fix it. You\'re not blamed because you followed protocol.', effects: { C: 1 }, log: 'Good judgment — followed protocol.' },
        failure: { text: 'The team lead is also at a BBQ. Nobody answers. The issue persists for 3 hours.', effects: { E: -1 }, log: 'Nobody answered the call.' }
      }
    ]
  },
  {
    id: 'mentor_junior',
    title: 'Mentor a Junior Developer',
    phase: 2,
    phaseLabel: 'Mid-Level Developer — Month 18',
    narrative: `A new junior dev has joined the team. They\'re enthusiastic but... they wrote a function that queries the entire database on every page load.\n\nThey ask you for a code review. The PR is 800 lines of... questionable decisions.\n\nYour manager says: "You\'ll mentor them this quarter."`,
    choices: [
      {
        text: 'Sit with them and teach through the problems',
        checks: { C: 7, I: 6 },
        success: { text: 'You pair program with them. They learn and improve. Two weeks later, they\'re shipping solid code. You\'ve made a great colleague.', effects: { C: 2, I: 1 }, log: 'Successfully mentored the junior dev!' },
        failure: { text: 'They don\'t quite get it. You end up rewriting their code yourself. It takes 3x longer than if you\'d just done it.', effects: { E: -2 }, log: 'Mentoring was harder than expected.' }
      },
      {
        text: 'Send them documentation and resources',
        checks: { I: 5 },
        success: { text: 'They\'re self-motivated and learn from the docs. They come to you with smart questions. Good mentorship!', effects: { I: 1, C: 1 }, log: 'Documentation-led mentoring worked.' },
        failure: { text: 'They read the docs but still don\'t understand. You get frustrated. They feel discouraged.', effects: { E: -1, C: -1 }, log: 'Docs weren\'t enough.' }
      }
    ]
  },
  {
    id: 'performance_optimization',
    title: 'Performance Crisis',
    phase: 2,
    phaseLabel: 'Mid-Level Developer — Month 22',
    narrative: `The app is slow. Really slow. Average page load: 8 seconds. Users are complaining. Churn is up 15%.\n\nYour task: "Make it fast." No specifics on how. The CEO wants it "fixed by next sprint."\n\nYou open the profiler. The app makes 47 API calls per page load. Forty. Seven.`,
    choices: [
      {
        text: 'Implement aggressive caching',
        checks: { I: 7, A: 6 },
        success: { text: 'You add Redis caching and reduce API calls from 47 to 3. Page load drops to 800ms. The CEO is thrilled. "This is why we pay you!"', effects: { I: 2, A: 1 }, log: 'Caching solved the performance crisis!' },
        failure: { text: 'You cache aggressively but introduce stale data bugs. Users see old information. Now you have TWO problems.', effects: { I: -1, E: -1 }, log: 'Cache caused new bugs.' }
      },
      {
        text: 'Rewrite the frontend — it\'s the bottleneck',
        checks: { S: 6, A: 7 },
        success: { text: 'You identify the rendering bottleneck and optimize it. You use virtualization and code splitting. Performance improves 5x.', effects: { S: 1, A: 2 }, log: 'Frontend optimization succeeded!' },
        failure: { text: 'The bottleneck wasn\'t the frontend — it was the backend. You\'ve optimized nothing. The CEO is not happy.', effects: { E: -2, P: -1 }, log: 'Wrong bottleneck identified.' }
      },
      {
        text: 'Present a roadmap to leadership',
        checks: { C: 8, I: 7 },
        success: { text: 'You present a realistic 3-phase plan. Leadership appreciates the honesty. You get 2 months instead of 2 weeks. Better outcome overall.', effects: { C: 2, I: 1 }, log: 'Leadership approved a realistic plan.' },
        failure: { text: 'Leadership doesn\'t understand. "Just make it fast" they say. You\'re back to square one with less time.', effects: { C: -1, E: -1 }, log: 'Couldn\'t manage expectations.' }
      }
    ]
  },
  {
    id: 'the_migration',
    title: 'BOSS: The Migration Project',
    phase: 2,
    phaseLabel: 'Mid-Level Developer — Boss Battle',
    narrative: `Your BOSS. The company is migrating from a monolith to microservices. This is the "big one."\n\nYou\'re leading the migration of the user authentication service. It has 14 dependencies, 3 of which are undocumented. The production database has 2 million records.\n\nDeadline: 4 weeks. Team: You and one other mid-level dev.\n\nThe migration looms.`,
    choices: [
      {
        text: 'Strangler pattern — migrate incrementally',
        checks: { I: 8, A: 6 },
        success: { text: 'You use the strangler fig pattern. Bit by bit, you migrate functionality. Zero downtime. The boss is impressed.', effects: { I: 2, A: 1 }, log: 'Strangler pattern conquered the migration!' },
        failure: { text: 'The incremental approach takes too long. The deadline approaches. You\'re 60% done with 1 week left.', effects: { E: -2, A: -1 }, log: 'Migration too slow.' }
      },
      {
        text: 'Big bang — cut over in one weekend',
        checks: { S: 7, L: 7 },
        success: { text: 'You prepare extensively. The cutover happens Saturday night. By Sunday morning, everything works. It was terrifying but it paid off.', effects: { S: 1, L: 1, A: 1 }, log: 'Big bang migration succeeded!' },
        failure: { text: 'Something breaks during cutover. The database migration script has a bug. You spend 18 hours restoring from backup.', effects: { S: -1, E: -3, L: -1 }, log: 'Big bang migration FAILED. 💀' }
      },
      {
        text: 'Request more time and people',
        checks: { C: 8, I: 6 },
        success: { text: 'You make a compelling case. Leadership gives you 2 more developers and 2 extra weeks. The migration proceeds smoothly.', effects: { C: 2, I: 1 }, log: 'Successfully negotiated resources.' },
        failure: { text: 'Leadership says "no budget." You\'re still migrating with your 1.5-person team. The deadline is immovable.', effects: { C: -1, E: -1 }, log: 'Resource request denied.' }
      }
    ]
  },
  
  // ===== Phase 3: Senior Developer =====
  {
    id: 'tech_debt_crisis',
    title: 'Tech Debt Crisis',
    phase: 3,
    phaseLabel: 'Senior Developer — Month 38',
    narrative: `You\'re senior now. And the tech debt is real.\n\nThe codebase has accumulated 3 years of "quick fixes." Half the tests are flaky. The deployment pipeline takes 45 minutes. New hires quit after a week.\n\nYour manager says: "We need to ship features, not fix old code." But you know: without paying down tech debt, shipping features will get slower and slower.\n\nYou need to make the case.`,
    choices: [
      {
        text: 'Propose a dedicated tech debt sprint',
        checks: { C: 8, I: 7 },
        success: { text: 'You present data: tech debt is causing 40% of all bugs. Management agrees to a 2-week cleanup sprint. The team morale improves dramatically.', effects: { C: 2, I: 2 }, log: 'Convinced leadership to fund tech debt cleanup!' },
        failure: { text: 'Management says "we\'ll get to it next quarter." They always say that. You sigh and go back to feature work.', effects: { E: -1 }, log: 'Tech debt proposal rejected again.' }
      },
      {
        text: 'Fix it quietly while shipping features',
        checks: { E: 8, A: 7 },
        success: { text: 'You refactor small pieces as you go. It\'s exhausting but the codebase slowly improves. Your team notices.', effects: { E: 1, I: 1 }, log: 'Quietly paid down tech debt.' },
        failure: { text: 'You try to fix things but feature work always takes priority. You\'re burned out and the codebase is worse than ever.', effects: { E: -3, S: -1 }, log: 'Burned out trying to fix everything.' }
      }
    ]
  },
  {
    id: 'interview_panel',
    title: 'The Interview Panel',
    phase: 3,
    phaseLabel: 'Senior Developer — Month 42',
    narrative: `You\'re on the engineering interview panel. A candidate is about to come in for a technical interview.\n\nYou\'ve been given a coding problem to administer. The problem is... you know it\'s a terrible problem. It tests trivia, not engineering ability.\n\nThe company standard says "use this exact problem." But you know good engineers when you see them.`,
    choices: [
      {
        text: 'Use the standard problem but adapt it',
        checks: { C: 7, I: 6 },
        success: { text: 'You follow the letter of the policy but add real-world context. The candidate shines. You hire them. They become a great teammate.', effects: { C: 1, I: 1 }, log: 'Hired a great candidate!' },
        failure: { text: 'The candidate is good but the problem doesn\'t showcase their strengths. They perform poorly. You reject them. Two months later, a competitor hires them as a senior.', effects: { E: -1, P: -1 }, log: 'Rejected a good candidate. Bad hire decision.' }
      },
      {
        text: 'Reject the standard problem and design your own',
        checks: { C: 6, I: 8 },
        success: { text: 'You design a realistic system design exercise. The candidate loves it. They show their true abilities. You hire them.', effects: { C: 1, I: 2 }, log: 'Better interview process led to great hire!' },
        failure: { text: 'Your manager says you broke protocol. The candidate is confused by your unstructured format. Nobody\'s happy.', effects: { C: -1, E: -1 }, log: 'Interview process was chaotic.' }
      }
    ]
  },
  {
    id: 'burnout_warning',
    title: 'Burnout Warning Signs',
    phase: 3,
    phaseLabel: 'Senior Developer — Month 48',
    narrative: `You\'ve been working 60+ hour weeks for 3 months. Your code quality is slipping. You\'re irritable in meetings. You check Slack in your dreams.\n\nYour doctor says: "You need to reduce stress." Your partner says: "You need to be present." Your team lead says: "We\'re worried about you."\n\nBut there\'s a major release next week.`,
    choices: [
      {
        text: 'Take a week off. Unplug completely.',
        checks: { C: 7 },
        success: { text: 'You hand off your responsibilities. The team manages fine. You come back refreshed and your code quality doubles. Your team respects you for prioritizing health.', effects: { E: 3, C: 1 }, log: 'Took time off. Came back stronger!' },
        failure: { text: 'You try to disconnect but the release needs you. You spend the week "off" answering Slack messages. It\'s the worst of both worlds.', effects: { E: -2 }, log: 'Couldn\'t truly disconnect.' }
      },
      {
        text: 'Delegate more and set boundaries',
        checks: { C: 8, E: 6 },
        success: { text: 'You delegate effectively and say "no" to non-essential work. Your team steps up. You maintain work-life balance and the release ships.', effects: { C: 2, E: 1 }, log: 'Found better work-life balance!' },
        failure: { text: 'You try to delegate but nobody else knows the system. You end up doing more work teaching others. The release is stressful.', effects: { E: -2 }, log: 'Delegation was harder than expected.' }
      },
      {
        text: 'Push through. It\'s just one more release.',
        checks: { E: 9, S: 7 },
        success: { text: 'Against all odds, you power through. The release ships. But you\'re running on fumes. The victory feels hollow.', effects: { E: -2, L: 1 }, log: 'Survived the release but at a cost.' },
        failure: { text: 'You collapse. Not dramatically — just a bad week of illness. The release is delayed. Your team covers for you but trust is damaged.', effects: { E: -4, C: -1 }, log: 'Burnout hit hard. 💀' }
      }
    ]
  },
  {
    id: 'the_platform_rewrite',
    title: 'BOSS: The Platform Rewrite',
    phase: 3,
    phaseLabel: 'Senior Developer — Boss Battle',
    narrative: `Your BOSS. The CTO has declared the entire platform "architecturally unsound" and wants a complete rewrite in a new stack.\n\n"The old system was built by amateurs," they say. (It was built by you and your team over 3 years.)\n\nYou\'re tasked with building the new platform. The old system has 2 million users. Downtime is NOT an option.\n\nThe rewrite challenge awaits.`,
    choices: [
      {
        text: 'Build it right — proper architecture, proper testing',
        checks: { I: 9, E: 7 },
        success: { text: 'You design a beautiful, scalable architecture. The new platform is 10x faster, 10x more reliable. It takes 6 months but it\'s worth it. You\'ve proven the old system\'s worth by building something even better.', effects: { I: 3, E: 1 }, log: 'Built a platform that outshines the old one!' },
        failure: { text: 'Perfection takes too long. The old system is still breaking while you\'re building the perfect new one. Leadership gets impatient.', effects: { I: -1, E: -2 }, log: 'Over-engineered the rewrite.' }
      },
      {
        text: 'Ship a minimal viable platform and iterate',
        checks: { A: 8, C: 6 },
        success: { text: 'You ship the basics in 2 months. It\'s not perfect but it works. You iterate based on real usage. Leadership is impressed by the speed.', effects: { A: 2, C: 1 }, log: 'MVP approach won leadership over!' },
        failure: { text: 'The MVP is too minimal. It can\'t handle production load. You have to rebuild significant portions. Now you have TWO platforms.', effects: { A: -1, E: -2 }, log: 'MVP was too minimal.' }
      },
      {
        text: 'Push back — the old system works fine',
        checks: { C: 9, I: 7 },
        success: { text: 'You present data showing the old system is stable. You propose incremental improvements instead of a rewrite. The CTO backs down. Crisis averted.', effects: { C: 3, I: 1 }, log: 'Successfully prevented an unnecessary rewrite!' },
        failure: { text: 'The CTO is unmoved. "I\'ve made my decision." You\'re stuck leading a rewrite you think is unnecessary. Morale plummets.', effects: { C: -2, E: -2 }, log: 'Couldn\'t stop the rewrite.' }
      }
    ]
  },
  
  // ===== Phase 4: Staff/Principal =====
  {
    id: 'executive_presentation',
    title: 'Executive Presentation',
    phase: 4,
    phaseLabel: 'Staff/Principal — Month 62',
    narrative: `You\'re presenting to the executive team. The board wants to know why engineering is "behind schedule" and "over budget."\n\nThey have a spreadsheet with 47 columns. None of them understand technical debt, context switching, or the difference between a bug fix and a feature.\n\nThe VP of Sales just asked: "Why can\'t you just ship faster?"`,
    choices: [
      {
        text: 'Tell the truth with data and analogies',
        checks: { C: 9, I: 7 },
        success: { text: 'You explain the situation with clear analogies and data. The executives finally understand. They adjust expectations and give you more resources.', effects: { C: 2, I: 1 }, log: 'Executives finally understand engineering!' },
        failure: { text: 'You get technical and lose them. The VP of Sales looks confused. The CEO says "I\'ll just ask the other departments to speed up."', effects: { C: -1, E: -1 }, log: 'Lost the executives in technical detail.' }
      },
      {
        text: 'Promise more and hope you can deliver',
        checks: { E: 7, A: 6 },
        success: { text: 'You overpromise but find a way to deliver. It\'s stressful but you pull it off. The executives are happy. (For now.)', effects: { A: 1, E: -1 }, log: 'Overpromised and delivered.' },
        failure: { text: 'You can\'t deliver on your promise. The executives lose trust in engineering. Future requests become more demanding.', effects: { C: -2, E: -2 }, log: 'Overpromised and underdelivered. 💀' }
      }
    ]
  },
  {
    id: 'open_source_controversy',
    title: 'Open Source Controversy',
    phase: 4,
    phaseLabel: 'Staff/Principal — Month 66',
    narrative: `Your company uses an open-source library that just had a major security vulnerability. The maintainer is one person who built it in their spare time over 5 years.\n\nThe board wants to: A) Replace the library entirely (risky, expensive) or B) Fork it and maintain it internally (legal minefield).\n\nThe maintainer just tweeted: "I can\'t maintain this anymore. I\'m burned out."\n\nYou need to make a recommendation.`,
    choices: [
      {
        text: 'Fund the maintainer to keep building it',
        checks: { C: 9, I: 7 },
        success: { text: 'You propose sponsoring the maintainer. The company agrees. The library gets a proper governance model. Everyone wins — including the entire open-source community.', effects: { C: 2, I: 2, L: 1 }, log: 'Saved the open-source project!' },
        failure: { text: 'Legal blocks the sponsorship. "Liability concerns." The maintainer leaves. You\'re now responsible for a critical dependency.', effects: { C: -1, E: -1 }, log: 'Couldn\'t save the maintainer.' }
      },
      {
        text: 'Start the migration to a replacement',
        checks: { I: 8, A: 7 },
        success: { text: 'You identify a viable alternative and create a migration plan. It\'s a year-long effort but the dependency risk is eliminated.', effects: { I: 1, A: 1 }, log: 'Migration plan created successfully.' },
        failure: { text: 'No viable alternative exists. You\'ve spent 3 months researching and there\'s nothing that matches the functionality. You\'re back to square one.', effects: { I: -1, E: -2 }, log: 'No good alternative found.' }
      }
    ]
  },
  {
    id: 'hiring_freeze',
    title: 'The Great Hiring Freeze',
    phase: 4,
    phaseLabel: 'Staff/Principal — Month 70',
    narrative: `The company is "right-sizing." There\'s a hiring freeze. But your team\'s workload just doubled.\n\nYou have 5 people doing the work of 10. Deadlines are unrealistic. Morale is at an all-time low.\n\nYour team lead asks: "How are we going to handle this?"\n\nYou\'re the senior person. They\'re looking to you.`,
    choices: [
      {
        text: 'Prioritize ruthlessly and say no to everything else',
        checks: { C: 8, I: 7 },
        success: { text: 'You work with product to cut the scope in half. You protect your team from distraction. They deliver on the priorities. It\'s hard but sustainable.', effects: { C: 2, I: 1 }, log: 'Protected the team through the freeze!' },
        failure: { text: 'You try to do everything and so does your team. Everyone works weekends. Productivity drops because everyone is exhausted.', effects: { E: -3 }, log: 'Tried to do everything. Failed.' }
      },
      {
        text: 'Automate the boring stuff',
        checks: { I: 9, A: 7 },
        success: { text: 'You identify automation opportunities. CI/CD improvements, automated testing, better tooling. The team becomes 2x more efficient.', effects: { I: 2, A: 2 }, log: 'Automation saved the team!' },
        failure: { text: 'Automation projects take time to build. In the short term, productivity drops. The team is frustrated.', effects: { E: -2, A: -1 }, log: 'Automation backfired (short term).' }
      }
    ]
  },
  {
    id: 'boardroom_strategy',
    title: 'Boardroom Strategy Session',
    phase: 4,
    phaseLabel: 'Staff/Principal — Month 74',
    narrative: `For the first time, you\'re invited to the executive strategy meeting. The board wants engineering\'s input on a major business decision: acquire a competitor or build the features in-house.\n\nThe competitor has 50 engineers and a mature product. Building in-house would take 18 months and cost $5M.\n\nThe CEO asks: "What would you recommend?"`,
    choices: [
      {
        text: 'Recommend acquisition — the tech is superior',
        checks: { I: 8, C: 8 },
        success: { text: 'You present a technical analysis. The board agrees. The acquisition goes through. You integrate the acquired product successfully.', effects: { I: 1, C: 2 }, log: 'Strategic acquisition succeeded!' },
        failure: { text: 'The acquired product has hidden technical issues. It\'s worse than expected. The integration costs 3x the budget.', effects: { I: -1, C: -1 }, log: 'Acquisition had hidden issues.' }
      },
      {
        text: 'Recommend building in-house — full control',
        checks: { I: 9, A: 7 },
        success: { text: 'You build it. It takes 18 months but the result is perfect for your needs. You have full IP ownership. The competitor is now irrelevant.', effects: { I: 2, A: 1 }, log: 'Built it and dominated the market!' },
        failure: { text: '18 months later, the market has moved on. The competitor launched 3 new features. Your "perfect" solution is already behind.', effects: { A: -2, P: -1 }, log: 'Built it but lost the timing.' }
      }
    ]
  },
  {
    id: 'restructure',
    title: 'BOSS: The Company-Wide Restructure',
    phase: 4,
    phaseLabel: 'Staff/Principal — Final Boss',
    narrative: `Your FINAL BOSS. The company is restructuring. Teams are being merged. Reports are changing. The org chart is being redrawn.\n\nYou\'ve spent 6 years building relationships, shipping products, and growing your career. Now everything is up in the air.\n\nThe new structure could make you a VP... or it could lay you off. Nobody knows yet.\n\nThis is it. Your career has led to this moment.`,
    choices: [
      {
        text: 'Lead with transparency — share everything you know',
        checks: { C: 10, I: 7 },
        success: { text: 'Your transparency earns trust. You\'re offered a VP role leading the new engineering organization. You\'ve reached the pinnacle of your career. Retirement? Or a new challenge?', effects: { C: 3, I: 1, L: 1 }, log: 'Reached the pinnacle! 🏆👑' },
        failure: { text: 'You share too much. Some information gets leaked. Management is unhappy. The restructuring is chaotic and you\'re left in limbo.', effects: { C: -2, E: -2 }, log: 'Transparency backfired. 💀' }
      },
      {
        text: 'Play it safe — say nothing and observe',
        checks: { P: 8, E: 7 },
        success: { text: 'You observe carefully, position yourself well, and land on your feet. You get a solid promotion. Not the top, but a great outcome.', effects: { P: 1, E: 1 }, log: 'Navigated the restructure safely.' },
        failure: { text: 'You play it too safe. You\'re left out of key decisions. When the new structure is announced, your role is eliminated.', effects: { E: -3, C: -1 }, log: 'Played too safe. Role eliminated. 💀' }
      },
      {
        text: 'Start interviewing at the same time',
        checks: { C: 7, A: 8 },
        success: { text: 'Your network is strong. You have 3 offers on the table before the restructuring is even announced. You choose the best one.', effects: { C: 1, A: 2, L: 1 }, log: 'Had backup plans ready!' },
        failure: { text: 'Interviews go poorly. The market is tough. You\'re still employed but unhappy. The restructuring leaves you in a worse position.', effects: { E: -2, L: -1 }, log: 'Backup plan didn\'t pan out.' }
      }
    ]
  },
  
  // ===== Extra Events =====
  {
    id: 'demo_day',
    title: 'Demo Day',
    phase: 2,
    phaseLabel: 'Mid-Level Developer',
    narrative: `It\'s demo day. You\'ve been building this feature for 3 weeks. The executives are watching via video call.\n\nYour code works on your machine. The staging environment is... questionable. The production environment is a mystery.\n\nYou hit "play."`,
    choices: [
      {
        text: 'Have a staging environment ready',
        checks: { I: 7 },
        success: { text: 'Staging works perfectly. The demo is smooth. The executives are impressed. "This is why we invest in infrastructure!"', effects: { I: 1, C: 1 }, log: 'Demo went perfectly!' },
        failure: { text: 'Staging is broken. You fumble through it. The demo shows a 404 error. The VP of Marketing laughs nervously.', effects: { C: -1, E: -1 }, log: 'Demo showed a 404. 😬' }
      },
      {
        text: 'Demo the cool parts, skip the broken parts',
        checks: { C: 7, A: 6 },
        success: { text: 'You\'re a smooth operator. The demo focuses on what works. The broken parts are "known issues in beta." Everyone is impressed.', effects: { C: 2, A: 1 }, log: 'Smooth demo — they didn\'t notice the broken parts.' },
        failure: { text: 'An executive asks to see the feature you skipped. "Can you show me the search?" You have no search. It\'s on fire.', effects: { C: -2, E: -2 }, log: 'Executive asked for the broken feature. 💀' }
      },
      {
        text: 'Pray to the deployment gods',
        checks: { L: 8 },
        success: { text: 'Against all odds, everything works. The demo is flawless. You\'re a hero. The universe has blessed your deployment.', effects: { L: 2 }, log: 'Miracle demo! ✨' },
        failure: { text: 'The gods are not pleased. The demo crashes. The video call freezes. The audio cuts out. It\'s a triple crown of failures.', effects: { L: -1, E: -2 }, log: 'Triple failure on demo day. 💀' }
      }
    ]
  },
  {
    id: 'the_requirements_change',
    title: 'The Requirements Change',
    phase: 1,
    phaseLabel: 'Junior Developer',
    narrative: `Product Manager walks in. "Hey, small change — can we make the app work offline, support 12 languages, and add a social feed? We need it by Friday."\n\nYou blink. You've been working on a login form.`,
    choices: [
      {
        text: 'Accept and suffer',
        checks: { E: 7 },
        success: { text: 'You work weekends. It\'s painful. But you deliver. Your PM thinks you\'re a wizard. (They don\'t know you cried in the bathroom.)', effects: { E: 1 }, log: 'Delivered the impossible. Barely.' },
        failure: { text: 'You can\'t deliver. The PM is disappointed. You\'re now known as "the one who couldn\'t do it."', effects: { E: -2, C: -1 }, log: 'Failed to deliver the "small change."' }
      },
      {
        text: 'Push back with data',
        checks: { I: 6, C: 6 },
        success: { text: 'You show the PM the effort estimates. They understand and negotiate a realistic timeline. Win-win.', effects: { I: 1, C: 1 }, log: 'Successfully pushed back on unrealistic scope.' },
        failure: { text: 'The PM says "just make it happen." You\'re not taken seriously. The deadline stays.', effects: { C: -1, E: -1 }, log: 'Pushback failed.' }
      },
      {
        text: 'Scream internally',
        checks: { L: 5 },
        success: { text: 'You channel your rage into focused energy. The requirements actually make sense if you squint. You deliver something reasonable.', effects: { L: 1, E: 1 }, log: 'Internal screaming led to unexpected clarity.' },
        failure: { text: 'The requirements are genuinely insane. You deliver something that\'s 12 languages but doesn\'t work offline. Compromise fails.', effects: { E: -2 }, log: 'Delivered a mess.' }
      }
    ]
  },
  {
    id: 'the_code_review_from_hell',
    title: 'The Code Review from Hell',
    phase: 2,
    phaseLabel: 'Mid-Level Developer',
    narrative: `Your PR has been sitting for 5 days. The senior dev finally comments: "Can you explain your thinking here? And here? And here? Also, have you considered rewriting this in Rust? And why are you using JavaScript in 2024?"\n\nThere are 47 comments. 3 of them are questions. 44 of them are "nitpicks."`,
    choices: [
      {
        text: 'Defend your architecture',
        checks: { C: 7, I: 6 },
        success: { text: 'You respond professionally and explain your tradeoffs. The senior dev says "Fair point." PR approved. You\'ve earned respect.', effects: { C: 1, I: 1 }, log: 'Professional code review defense.' },
        failure: { text: 'You get defensive. The conversation turns personal. The PR sits for another week.', effects: { C: -1, E: -2 }, log: 'Code review became a fight.' }
      },
      {
        text: 'Make all the changes',
        checks: { E: 6 },
        success: { text: 'You make the changes. It\'s tedious but you learn something. PR approved after 2 more rounds.', effects: { P: 1 }, log: 'Made all review changes. Patient.' },
        failure: { text: 'You make the changes but introduce new bugs. The review cycle never ends. You\'ve been in this PR for 3 weeks.', effects: { E: -2, P: -1 }, log: 'Infinite review loop. 😵‍💫' }
      },
      {
        text: 'Ask for specific feedback',
        checks: { C: 6, I: 5 },
        success: { text: 'You ask the senior dev to prioritize: "What are the 3 most important changes?" They respond with a focused list. PR gets approved.', effects: { C: 1, P: 1 }, log: 'Got focused feedback!' },
        failure: { text: 'They say "everything needs work." It\'s not helpful. You\'re stuck.', effects: { E: -1 }, log: 'Unhelpful feedback.' }
      }
    ]
  },
  {
    id: 'the_performance_review',
    title: 'Performance Review',
    phase: 3,
    phaseLabel: 'Senior Developer',
    narrative: `It\'s performance review season. Your manager calls you into a meeting (or Zoom call). They have a document.\n\n"Let\'s talk about your year. You\'ve delivered well on most projects. Your code quality has improved. However..."\n\nThe "however" is coming.`,
    choices: [
      {
        text: 'Prepare your accomplishments in advance',
        checks: { I: 7, C: 6 },
        success: { text: 'You present a well-documented list of achievements. Your manager is impressed. You get a strong rating and a raise.', effects: { C: 1, I: 1, L: 1 }, log: "Aced the performance review!" },
        failure: { text: 'You wing it. Your manager has a different view of your year. The rating is lower than expected.', effects: { C: -1, E: -1 }, log: 'Performance review didn\'t go well.' }
      },
      {
        text: 'Ask for honest feedback',
        checks: { E: 7, C: 6 },
        success: { text: 'You get candid, useful feedback. You create a growth plan. Your manager respects your maturity.', effects: { E: 1, I: 1 }, log: 'Got valuable feedback.' },
        failure: { text: 'The feedback is harsh and unconstructive. "You need more visibility." Translation: "You need to be more political."', effects: { E: -2, C: -1 }, log: 'Feedback was demoralizing.' }
      }
    ]
  },
  {
    id: 'conference_talk',
    title: 'Conference Talk Opportunity',
    phase: 3,
    phaseLabel: 'Senior Developer',
    narrative: `Your company is sending 3 people to a major tech conference. Your manager asks who wants to go and present.\n\nPublic speaking terrifies you. But it\'s a career opportunity. The conference has 5,000 attendees and industry leaders.\n\nYour coworker who loves attention is also interested.`,
    choices: [
      {
        text: 'Say yes and prepare rigorously',
        checks: { C: 7, E: 6 },
        success: { text: 'You practice for weeks. Your talk is excellent. You meet industry leaders. Your career gets a huge boost.', effects: { C: 2, I: 1 }, log: 'Killed the conference talk!' },
        failure: { text: 'You freeze on stage. It\'s awkward. But... people were kind. You learn and come back stronger next year.', effects: { E: -1, C: 1 }, log: 'Conference talk was rough but you learned.' }
      },
      {
        text: 'Nominate your extroverted coworker',
        checks: { C: 5 },
        success: { text: 'Your coworker absolutely crushes it. They thank you for the opportunity. You look like a team player.', effects: { C: 1 }, log: 'Team player move.' },
        failure: { text: 'Your coworker steals your thunder. They mention your work in their talk and get all the credit. You\'re not mad. (You\'re a little mad.)', effects: { C: -1 }, log: 'Coworker took the spotlight.' }
      }
    ]
  },
  {
    id: 'the_3am_email',
    title: 'The 3 AM Email',
    phase: 1,
    phaseLabel: 'Junior Developer',
    narrative: `You\'re asleep. Your phone buzzes. An email from the CTO at 3:14 AM:\n\n"I know it\'s late but I had an idea. What if we added AI to everything? Let\'s discuss tomorrow."\n\nIt\'s not an emergency. It\'s a "vision."`,
    choices: [
      {
        text: 'Respond professionally in the morning',
        checks: { C: 6, E: 5 },
        success: { text: 'You respond with enthusiasm and schedule a meeting. The CTO\'s idea is crazy but you channel it into something reasonable.', effects: { C: 1 }, log: 'Handled the 3 AM email like a pro.' },
        failure: { text: 'You respond too enthusiastically. The CTO thinks you\'re on board with "AI for everything." You\'re now tasked with a moonshot project.', effects: { E: -1 }, log: 'Accidentally volunteered for a moonshot.' }
      },
      {
        text: 'Don\'t respond until 9 AM',
        checks: { E: 4 },
        success: { text: 'You sleep. In the morning, you respond calmly. The CTO\'s energy has faded. The "vision" becomes a normal discussion.', effects: { E: 1 }, log: 'Sleep > 3 AM emails.' },
        failure: { text: 'The CTO interprets your silence as agreement. They\'ve already started building a prototype. You\'re expected to help.', effects: { E: -1, C: -1 }, log: 'Silence was interpreted as commitment.' }
      }
    ]
  },
  {
    id: 'the_tech_debt_sprint',
    title: 'The "Quick" Fix',
    phase: 1,
    phaseLabel: 'Junior Developer',
    narrative: `Your senior dev says: "This is a quick fix. Should take 30 minutes."\n\nThe "quick fix" involves modifying a file that 47 other files import. The file has no tests. The comment at the top says "DO NOT MODIFY."\n\nThe senior dev is on vacation. You\'re alone.`,
    choices: [
      {
        text: 'Do it carefully — add tests first',
        checks: { I: 6, P: 5 },
        success: { text: 'You add tests, make the change, and verify. It takes 3 hours instead of 30 minutes but nothing breaks.', effects: { I: 1, P: 1 }, log: 'Careful approach paid off.' },
        failure: { text: 'You can\'t add tests because the code is too tightly coupled. You make the change anyway. It works... for now.', effects: { P: -1 }, log: 'Made the change. Prayed nothing broke.' }
      },
      {
        text: 'Find someone else to do it',
        checks: { C: 5 },
        success: { text: 'You find a colleague who has capacity. They do it in 30 minutes. You\'ve learned the value of delegation.', effects: { C: 1 }, log: 'Delegated successfully.' },
        failure: { text: 'Everyone is busy. The "quick fix" becomes a "medium fix" becomes a "why didn\'t we plan for this" fix.', effects: { E: -1 }, log: 'Couldn\'t delegate. Fix dragged on.' }
      }
    ]
  },
  {
    id: 'the_boss_day_off',
    title: 'The Boss Wants Your Weekend',
    phase: 2,
    phaseLabel: 'Mid-Level Developer',
    narrative: `Friday at 4 PM. Your boss walks by: "Hey, we have a deadline Monday morning. Can everyone work this weekend? Just a few hours each day."\n\nYou have plans. You have a life. You have a weekend.\n\nYour team is looking at you. You\'re the senior one now.`,
    choices: [
      {
        text: 'Volunteer and work the weekend',
        checks: { E: 7 },
        success: { text: 'You power through. The deadline is met. Your boss is grateful. But you\'re exhausted on Monday.', effects: { E: -1, C: 1 }, log: 'Worked the weekend. Delivered.' },
        failure: { text: 'You work but you\'re too tired to be effective. You make a mistake that costs more time than the weekend work saved.', effects: { E: -2, P: -1 }, log: 'Burnout led to mistakes.' }
      },
      {
        text: 'Push back — propose alternatives',
        checks: { C: 7, I: 6 },
        success: { text: 'You propose a realistic plan: work Saturday morning, ship Monday afternoon. The boss agrees. Work-life balance preserved.', effects: { C: 2, I: 1 }, log: 'Negotiated a reasonable compromise!' },
        failure: { text: 'The boss insists. "Everyone else is doing it." You\'re now known as "the one who wouldn\'t work weekends."', effects: { C: -1, E: -1 }, log: 'Couldn\'t negotiate. Weekend lost.' }
      },
      {
        text: 'Organize the team rotation',
        checks: { C: 8, A: 6 },
        success: { text: 'You organize a fair rotation. Each person works one day. The work gets done and nobody burns out. You\'re a natural leader.', effects: { C: 2, A: 1 }, log: 'Organized fair team rotation!' },
        failure: { text: 'The rotation falls apart. People don\'t coordinate. You end up doing the most work. Leadership is happy but you\'re not.', effects: { C: -1, E: -2 }, log: 'Rotation failed. You did most of the work.' }
      }
    ]
  },
  {
    id: 'the_standup',
    title: 'Daily Standup from Hell',
    phase: 1,
    phaseLabel: 'Junior Developer — Month 5',
    narrative: `Daily standup. Your team lead asks: "What did you do yesterday? What will you do today? Any blockers?"

You've been stuck on the same bug for 3 days. Your blocker is... you don't understand the code.

All eyes are on you.`,
    choices: [
      {
        text: 'Be honest about the blocker',
        checks: { C: 5, E: 5 },
        success: { text: 'You admit you need help. A senior dev volunteers to pair with you. You learn a lot in 2 hours.', effects: { C: 1, P: 1 }, log: 'Honesty paid off — learned from a senior dev!' },
        failure: { text: 'Your manager sighs. "Figure it out." You go back to staring at the code.', effects: { E: -1 }, log: 'Told the truth. Got the axe.' }
      },
      {
        text: 'Pretend you have a plan',
        checks: { C: 6, A: 4 },
        success: { text: 'You bluff your way through. The standup moves on. You have 23 hours to fix the bug.', effects: { C: 1, A: 1 }, log: 'Bluffed successfully. Now panic.' },
        failure: { text: 'Your manager asks for details. You don\'t have any. The meeting gets awkward.', effects: { C: -1, E: -1 }, log: 'Bluff failed. Cringe.' }
      }
    ]
  },
  {
    id: 'the_merge_conflict',
    title: 'The Merge Conflict',
    phase: 1,
    phaseLabel: 'Junior Developer — Month 6',
    narrative: `You\'ve been working on a feature branch for 2 weeks. Time to merge to main.

There are 47 merge conflicts. Some are in files you don\'t recognize. One conflict is in a file named "TODO.txt" that contains only the word "help me."

Your coworker who wrote the conflicting code quit last week.`,
    choices: [
      {
        text: 'Resolve conflicts carefully',
        checks: { P: 6, E: 5 },
        success: { text: 'You carefully resolve each conflict. The build passes. You feel like a warrior.', effects: { P: 1, E: 1 }, log: 'Survived the merge conflict war.' },
        failure: { text: 'You resolve conflicts but break something. The CI pipeline fails. You start over.', effects: { P: -1, E: -2 }, log: 'Merge conflict broke everything.' }
      },
      {
        text: 'Delete everything and start fresh',
        checks: { A: 7, L: 5 },
        success: { text: 'You nuke the branch and redo the feature. It takes 4 hours but works perfectly.', effects: { A: 2 }, log: 'Nuclear option — fast and clean.' },
        failure: { text: 'You delete the wrong branch. Your feature is gone. You\'re starting from zero.', effects: { E: -3, L: -1 }, log: 'Deleted the wrong branch. 💀' }
      }
    ]
  },
  {
    id: 'the_hotfix',
    title: 'The Midnight Hotfix',
    phase: 2,
    phaseLabel: 'Mid-Level Developer — Month 15',
    narrative: `It\'s 11 PM on a Friday. Your phone buzzes.

"URGENT: Production is down. Need someone to push a hotfix ASAP."

You\'re at dinner with friends. Your phone has 47 unread messages from the on-call team.

The hotfix involves changing a single line in a file you\'ve never seen before.`,
    choices: [
      {
        text: 'Remote in and fix it',
        checks: { A: 7, P: 6 },
        success: { text: 'You find the bug, fix it, and deploy in 20 minutes. Your friends think you\'re a superhero.', effects: { A: 1, P: 1 }, log: 'Friday night hero — saved production!' },
        failure: { text: 'You fix the wrong line. Production stays down. Your friends leave without you.', effects: { E: -2, P: -1 }, log: 'Friday night disaster.' }
      },
      {
        text: 'Wake up the senior dev',
        checks: { C: 6, E: 5 },
        success: { text: 'The senior dev fixes it in 10 minutes. You learn what happened. You\'re on call next week.', effects: { C: 1 }, log: 'Handed off to senior. Learned something.' },
        failure: { text: 'The senior dev is asleep. You wait 30 minutes. Production stays down.', effects: { E: -2 }, log: 'Senior dev was asleep. Too late.' }
      }
    ]
  },
  {
    id: 'the_technical_debt',
    title: 'Technical Debt Avalanche',
    phase: 2,
    phaseLabel: 'Mid-Level Developer — Month 20',
    narrative: `You\'ve been assigned to a new feature. The code you need to modify hasn\'t been touched in 3 years.

It\'s written in a framework that\'s no longer maintained. The comments say "TODO: rewrite this" in 47 places.

The deadline is next week.`,
    choices: [
      {
        text: 'Work around the debt',
        checks: { I: 7, A: 6 },
        success: { text: 'You write a thin wrapper around the legacy code. It\'s ugly but it works. Feature ships on time.', effects: { I: 1, A: 1 }, log: 'Wrapped the legacy mess. Ship it.' },
        failure: { text: 'Your wrapper breaks the whole system. You\'ve made things worse.', effects: { I: -1, E: -2 }, log: 'Wrapper broke everything.' }
      },
      {
        text: 'Refactor first, feature later',
        checks: { I: 8, C: 6 },
        success: { text: 'You refactor the legacy code, write tests, and add the feature. It takes 3 weeks but the code is beautiful now.', effects: { I: 2, P: 1 }, log: 'Refactored the mess. Beautiful code.' },
        failure: { text: 'You refactor but miss edge cases. The feature doesn\'t work. Your manager is not happy.', effects: { I: -1, C: -1 }, log: 'Refactor went wrong.' }
      }
    ]
  },
  {
    id: 'the_performance_review_2',
    title: 'The Promotion Review',
    phase: 3,
    phaseLabel: 'Senior Developer — Month 40',
    narrative: `It\'s promotion review season. You\'re up for Senior → Staff.

Your manager says: "You need more visibility. You need to influence at a higher level. You need to..."

You look at your coworker who just gave a talk at a major conference. They\'re already getting their promotion packet.

You\'ve spent 6 months deep in the code. Nobody knows what you\'ve built.`,
    choices: [
      {
        text: 'Write a detailed impact report',
        checks: { I: 7, C: 6 },
        success: { text: 'You write a compelling report showing your impact. Your manager is impressed. You get the promotion.', effects: { I: 1, C: 1 }, log: 'Impact report nailed the promotion!' },
        failure: { text: 'Your report is too technical. Your manager doesn\'t understand it. You wait another quarter.', effects: { C: -1 }, log: 'Report was too technical.' }
      },
      {
        text: 'Start giving talks and writing blog posts',
        checks: { C: 8, A: 6 },
        success: { text: 'You give a talk at an internal tech day. People are impressed. You get invited to speak externally.', effects: { C: 2, A: 1 }, log: 'Talk went viral — promotion secured!' },
        failure: { text: 'Nobody shows up to your talk. 3 people attend. One is your manager.', effects: { C: -1, E: -1 }, log: 'Talk had 3 attendees. Ouch.' }
      }
    ]
  },
  {
    id: 'the_security_audit',
    title: 'The Security Audit',
    phase: 3,
    phaseLabel: 'Senior Developer — Month 45',
    narrative: `The security team just finished their audit. Your service has 237 vulnerabilities. 12 are critical.

The worst one: your API keys are hardcoded in the source code. They\'ve been public on GitHub for 6 months.

The CISO wants a meeting. Tomorrow.`,
    choices: [
      {
        text: 'Own it and fix everything',
        checks: { C: 8, E: 7 },
        success: { text: 'You admit the mistakes and present a remediation plan. The CISO respects your honesty. You fix everything in 2 weeks.', effects: { C: 2, P: 1 }, log: 'Owned the mistakes. Fixed everything.' },
        failure: { text: 'The CISO is furious. They want your head. You\'re assigned to security work for the next 6 months.', effects: { E: -2, C: -1 }, log: 'CISO wants blood. Security prison.' }
      },
      {
        text: 'Blame the legacy code',
        checks: { C: 6, I: 5 },
        success: { text: 'You blame the legacy codebase. The CISO buys it. You get a pass. (You\'re a little ashamed.)', effects: { C: 1 }, log: 'Blamed legacy. Got off easy.' },
        failure: { text: 'The CISO knows you wrote the code. They don\'t buy the excuse. You\'re in trouble.', effects: { C: -2, E: -2 }, log: 'Excuse didn\'t work. In trouble.' }
      }
    ]
  },
  {
    id: 'the_keynote',
    title: 'The Keynote Invitation',
    phase: 3,
    phaseLabel: 'Senior Developer — Month 50',
    narrative: `You\'ve been invited to give a keynote at a major tech conference. 3,000 attendees. Industry leaders in the audience.

Your topic: "How we scaled our platform to 10 million users."

You\'ve never given a keynote. You\'ve barely given a talk.

Your hands are shaking.`,
    choices: [
      {
        text: 'Practice like your life depends on it',
        checks: { E: 7, C: 7 },
        success: { text: 'You practice for weeks. The keynote is a hit. People approach you after with job offers.', effects: { C: 2, I: 1 }, log: 'Keynote was a massive success!' },
        failure: { text: 'You freeze on stage. It\'s painful. But people were kind. You learn and come back stronger.', effects: { E: -1, C: 1 }, log: 'Freeze on stage. But you learned.' }
      },
      {
        text: 'Hire a professional speaker coach',
        checks: { C: 6, I: 5 },
        success: { text: 'The coach helps you find your voice. The keynote is great. You\'re a natural.', effects: { C: 2 }, log: 'Speaker coach made you a pro!' },
        failure: { text: 'The coach is a scam. You waste $5,000 and still freeze on stage.', effects: { E: -2, C: -1 }, log: 'Speaker coach was a scam. 💀' }
      }
    ]
  },
  {
    id: 'the_data_breach',
    title: 'The Data Breach',
    phase: 4,
    phaseLabel: 'Staff/Principal — Month 65',
    narrative: `It\'s 2 AM. Your phone buzzes.

"We\'ve been breached. User data is exposed. The press is calling. The board wants answers."

You\'re the most senior engineer on call. This is your moment.

The breach was caused by an unpatched vulnerability in a library you recommended last month.`,
    choices: [
      {
        text: 'Lead the incident response',
        checks: { E: 9, C: 8 },
        success: { text: 'You lead the team through the night. You contain the breach, notify users, and work with legal. It\'s the hardest 12 hours of your career.', effects: { E: 1, C: 2 }, log: 'Led through the darkest hour.' },
        failure: { text: 'You make a wrong call. The breach gets worse. The board is not happy.', effects: { E: -3, C: -2 }, log: 'Wrong call. Breach got worse.' }
      },
      {
        text: 'Delegate and let the security team handle it',
        checks: { C: 7, I: 6 },
        success: { text: 'You trust your security team. They handle it professionally. You focus on the technical response.', effects: { C: 1, I: 1 }, log: 'Trusted the team. Handled well.' },
        failure: { text: 'The security team is overwhelmed. You should have stepped in. The breach spreads.', effects: { C: -2, E: -2 }, log: 'Should have stepped in.' }
      }
    ]
  },
  {
    id: 'the_board_meeting',
    title: 'The Board Presentation',
    phase: 4,
    phaseLabel: 'Staff/Principal — Month 72',
    narrative: `You\'re presenting to the board. They want to know the 5-year tech strategy.

You have a 30-minute slot. The board has 12 people. 8 of them don\'t know what a API is.

The CEO says: "Keep it simple. We want to know why we\'re spending $50M on engineering."

Your slides have architecture diagrams.`,
    choices: [
      {
        text: 'Use analogies and simple language',
        checks: { C: 9, I: 7 },
        success: { text: 'You explain tech strategy using restaurant analogies. The board understands. They approve the budget.', effects: { C: 2, I: 1 }, log: 'Board understood the analogies!' },
        failure: { text: 'The board is confused. The CEO asks "Why can\'t you just use NoSQL?" You don\'t know how to answer.', effects: { C: -1, E: -1 }, log: 'Board was confused. Ouch.' }
      },
      {
        text: 'Show the architecture diagrams',
        checks: { I: 8, P: 6 },
        success: { text: 'The CTO on the board loves it. They champion your proposal. Budget approved.', effects: { I: 1, C: 1 }, log: 'CTO on board loved the diagrams!' },
        failure: { text: 'The board falls asleep. The CEO asks if you can make it "easier to understand."', effects: { C: -2, E: -2 }, log: 'Board fell asleep. 💀' }
      }
    ]
  },
  {
    id: 'the_open_source_crisis',
    title: 'The Open Source Crisis',
    phase: 4,
    phaseLabel: 'Staff/Principal — Month 78',
    narrative: `Your company\'s flagship product uses an open-source library that just announced it\'s shutting down.

The maintainer is retiring. No successor. No fork.

Your product will break in 90 days. You have 3 options: rewrite, replace, or pray.

The board wants to know what\'s happening.`,
    choices: [
      {
        text: 'Start the rewrite immediately',
        checks: { I: 9, E: 7 },
        success: { text: 'You lead a team to rewrite the dependency. It takes 6 months but you\'re self-sufficient now.', effects: { I: 2, E: 1 }, log: 'Rewrote the dependency. Self-sufficient!' },
        failure: { text: 'The rewrite takes too long. The library shuts down. Your product breaks. Chaos ensues.', effects: { E: -3, I: -1 }, log: 'Rewrite too slow. Product broken.' }
      },
      {
        text: 'Find a replacement library',
        checks: { I: 7, A: 7 },
        success: { text: 'You find a better alternative. Migration takes 3 months. Your product is more stable now.', effects: { I: 1, A: 1 }, log: 'Found a better alternative!' },
        failure: { text: 'No good replacement exists. You\'re stuck maintaining the old code.', effects: { I: -1, E: -1 }, log: 'No replacement found. Stuck.' }
      }
    ]
  },
  {
    id: 'the_merger',
    title: 'The Company Merger',
    phase: 4,
    phaseLabel: 'Staff/Principal — Month 80',
    narrative: `Your company is merging with a competitor. Both have engineering teams. Both have different tech stacks.

The new CEO says: "We\'re keeping one stack. Figure out which one."

Your stack is newer but less battle-tested. Their stack is older but proven.

Both teams are nervous. Both want their stack to win.`,
    choices: [
      {
        text: 'Propose a hybrid approach',
        checks: { C: 9, I: 8 },
        success: { text: 'You propose migrating gradually. Both teams contribute. The new system is better than either original.', effects: { C: 2, I: 2 }, log: 'Hybrid approach won the merger!' },
        failure: { text: 'The CEO wants a clear winner. Your hybrid proposal is rejected. You\'re stuck in limbo.', effects: { C: -1, E: -1 }, log: 'Hybrid rejected. Limbo.' }
      },
      {
        text: 'Fight for your stack',
        checks: { C: 7, I: 7 },
        success: { text: 'You make a compelling case. Your stack wins. Your team is thrilled.', effects: { C: 1, I: 1 }, log: 'Your stack won the merger!' },
        failure: { text: 'Your stack loses. Your team is devastated. You\'re now maintaining their code.', effects: { C: -2, E: -2 }, log: 'Stack lost. Team devastated.' }
      }
    ]
  },
  {
    id: 'the_mentor_crisis',
    title: 'The Mentor Crisis',
    phase: 2,
    phaseLabel: 'Mid-Level Developer — Month 25',
    narrative: `You\'re mentoring a junior dev who keeps making the same mistake. Over and over.

They fix it. You review it. They break it again the next day.

Your patience is wearing thin. They look defeated.

Their performance review is next week.`,
    choices: [
      {
        text: 'Sit with them and figure out the root cause',
        checks: { C: 7, E: 6 },
        success: { text: 'You discover they don\'t understand the fundamentals. You create a learning plan. They improve dramatically.', effects: { C: 2, P: 1 }, log: 'Found the root cause. They improved!' },
        failure: { text: 'You can\'t figure out what\'s wrong. They fail their review. You feel responsible.', effects: { E: -2, C: -1 }, log: 'Couldn\'t help them. They failed.' }
      },
      {
        text: 'Tell them to read the documentation',
        checks: { E: 5, C: 4 },
        success: { text: 'They read the docs. It clicks. They improve. You\'re a hands-off mentor.', effects: { C: 1 }, log: 'Docs did the trick.' },
        failure: { text: 'They read the docs but still don\'t understand. They\'re frustrated. You\'re frustrated.', effects: { C: -1, E: -1 }, log: 'Docs weren\'t enough.' }
      }
    ]
  },
  {
    id: 'the_demos',
    title: 'Demo Day Disaster',
    phase: 1,
    phaseLabel: 'Junior Developer — Month 8',
    narrative: `It\'s demo day. You\'ve been building a feature for 3 weeks. The product team, engineering leads, and CEO are watching.

Your code works on your machine. The staging environment is... questionable.

You hit play. The page loads. Then it crashes.

The CEO raises an eyebrow.`,
    choices: [
      {
        text: 'Pivot and demo the testing framework instead',
        checks: { A: 7, C: 6 },
        success: { text: 'You smoothly pivot: "Actually, let me show you the automated testing that caught 12 bugs." They\'re impressed.', effects: { A: 1, C: 1 }, log: 'Smooth pivot — saved the demo!' },
        failure: { text: 'You pivot but the tests are broken too. The demo is a total loss.', effects: { C: -1, E: -2 }, log: 'Pivot failed. Demo ruined.' }
      },
      {
        text: 'Own the failure and show the bug tracker',
        checks: { C: 6, P: 5 },
        success: { text: 'You say: "The crash is expected — it\'s in QA. Let me show you what we\'ve fixed." They appreciate the honesty.', effects: { C: 1, P: 1 }, log: 'Owned the failure. Honest demo.' },
        failure: { text: 'They don\'t buy it. The CEO asks why you demoed untested code. You\'re embarrassed.', effects: { C: -1, E: -1 }, log: 'Didn\'t buy it. Embarrassed.' }
      }
    ]
  },
  {
    id: 'the_404',
    title: 'The 404 That Wasn\'t',
    phase: 2,
    phaseLabel: 'Mid-Level Developer — Month 28',
    narrative: `A user reports a 404 error. You check the logs. The page exists. The route exists. The code exists.

You check the CDN. You check the load balancer. You check the DNS.

Everything looks fine. But the user still gets a 404.

You\'ve been debugging this for 4 hours. It\'s 2 AM.`,
    choices: [
      {
        text: 'Check the user\'s network',
        checks: { P: 7, E: 6 },
        success: { text: 'The user\'s ISP is blocking the domain. You tell them to use a different network. Problem solved.', effects: { P: 1, E: 1 }, log: 'ISP was the problem. Solved!' },
        failure: { text: 'You spend 2 more hours on the user\'s network. It\'s not that. You\'re exhausted.', effects: { E: -2 }, log: 'Not the ISP. Exhausted.' }
      },
      {
        text: 'Restart the CDN',
        checks: { A: 6, L: 5 },
        success: { text: 'You restart the CDN. The 404 goes away. It was a cache issue. You\'re a wizard.', effects: { A: 1, L: 1 }, log: 'CDN restart fixed it!' },
        failure: { text: 'You restart the CDN. The 404 gets worse. More users are affected.', effects: { E: -2, L: -1 }, log: 'CDN restart made it worse.' }
      }
    ]
  },
  {
    id: 'the_kpi',
    title: 'The KPI Trap',
    phase: 3,
    phaseLabel: 'Senior Developer — Month 43',
    narrative: `Your manager introduces new KPIs: lines of code committed, PRs merged per week, tickets closed.

You\'ve been writing careful, well-tested code. This will make you look bad.

Your coworker who writes spaghetti code is now the top performer.

The CEO loves the dashboard.`,
    choices: [
      {
        text: 'Push back on the KPIs',
        checks: { C: 8, I: 7 },
        success: { text: 'You present data showing KPIs don\'t correlate with quality. Your manager listens. KPIs are changed.', effects: { C: 2, I: 1 }, log: 'KPIs changed after your pushback!' },
        failure: { text: 'Your manager says "the CEO loves the dashboard." You\'re told to adapt.', effects: { C: -1, E: -1 }, log: 'KPIs stay. Coworker wins.' }
      },
      {
        text: 'Game the KPIs',
        checks: { A: 7, E: 6 },
        success: { text: 'You break features into tiny PRs. Your KPIs look great. You feel dirty but you\'re #1.', effects: { A: 1, E: 1 }, log: 'Gamed the KPIs. Feel dirty.' },
        failure: { text: 'Your manager notices the tiny PRs. They ask why you\'re not shipping features.', effects: { C: -1, E: -2 }, log: 'Caught gaming KPIs.' }
      }
    ]
  },
  {
    id: 'the_oncall_nightmare',
    title: 'The On-Call Nightmare',
    phase: 3,
    phaseLabel: 'Senior Developer — Month 47',
    narrative: `It\'s your on-call week. Your phone buzzes at 3 AM.

"Database is down. Users can\'t log in. The CEO is calling."

You\'ve been on-call for 3 weeks straight. You\'re exhausted.

The database cluster has 47 nodes. You don\'t know which one is failing.`,
    choices: [
      {
        text: 'Diagnose systematically',
        checks: { P: 8, E: 7 },
        success: { text: 'You methodically check each node. You find the failing one. You restart it. Database recovers.', effects: { P: 2, E: 1 }, log: 'Systematic approach saved the day!' },
        failure: { text: 'You check nodes randomly. You waste 2 hours. The CEO calls again.', effects: { E: -3, P: -1 }, log: 'Random checks wasted time.' }
      },
      {
        text: 'Call the DBA team',
        checks: { C: 6, E: 5 },
        success: { text: 'The DBA team fixes it in 15 minutes. You learn the root cause. You\'re on-call again next week.', effects: { C: 1 }, log: 'DBA team handled it.' },
        failure: { text: 'The DBA team is asleep. You wait 45 minutes. The CEO is furious.', effects: { E: -2, C: -1 }, log: 'DBA team asleep. CEO furious.' }
      }
    ]
  },
  {
    id: 'the_refactor',
    title: 'The Refactor Temptation',
    phase: 2,
    phaseLabel: 'Mid-Level Developer — Month 19',
    narrative: `You\'re assigned to a feature. The code you need to touch is... terrible.

It\'s a 2,000-line function. It has nested if-statements 12 levels deep. The variable names are single letters.

You know you should refactor first. Your manager says "just ship the feature."

But you can\'t help yourself. The code is hurting you.`,
    choices: [
      {
        text: 'Refactor first, feature later',
        checks: { I: 7, E: 6 },
        success: { text: 'You refactor the function into clean, testable pieces. Then you add the feature in 2 days.', effects: { I: 2, P: 1 }, log: 'Refactored the mess. Ship it!' },
        failure: { text: 'You refactor but introduce bugs. The feature doesn\'t work. Your manager is not happy.', effects: { I: -1, E: -2 }, log: 'Refactor introduced bugs.' }
      },
      {
        text: 'Just ship the feature',
        checks: { A: 6, E: 5 },
        success: { text: 'You hack together the feature. It works. You add a TODO comment for future refactoring.', effects: { A: 1 }, log: 'Feature shipped. TODO added.' },
        failure: { text: 'You hack it together but miss edge cases. The feature breaks in production.', effects: { E: -2, P: -1 }, log: 'Hacked feature broke prod.' }
      }
    ]
  },
  {
    id: 'the_retrospective',
    title: 'The Blameless Retrospective',
    phase: 3,
    phaseLabel: 'Senior Developer — Month 44',
    narrative: `A production incident just happened. Your team is in a retrospective.

The manager says: "This is a blameless retrospective. Let\'s focus on process, not people."

But everyone is looking at you. You deployed the bad code. You missed the test. You should have caught it.

The silence is deafening.`,
    choices: [
      {
        text: 'Own your mistake publicly',
        checks: { C: 8, E: 7 },
        success: { text: 'You admit your mistake and propose process improvements. Your team respects your honesty.', effects: { C: 2, P: 1 }, log: 'Owned the mistake. Team respected you!' },
        failure: { text: 'You admit your mistake but your manager takes it too far. They make it about you, not process.', effects: { C: -1, E: -2 }, log: 'Manager made it about you.' }
      },
      {
        text: 'Stay quiet and let it pass',
        checks: { E: 5, L: 5 },
        success: { text: 'Nobody mentions you. The retrospective moves on. You learn privately.', effects: { E: 1 }, log: 'Stayed quiet. Learned privately.' },
        failure: { text: 'Your coworker mentions you. "John deployed the bad code." The room turns to you.', effects: { C: -2, E: -1 }, log: 'Coworker called you out.' }
      }
    ]
  },
  {
    id: 'the_api_change',
    title: 'The Breaking API Change',
    phase: 4,
    phaseLabel: 'Staff/Principal — Month 68',
    narrative: `Your team\'s API just broke a major client\'s integration. You changed a response format without a deprecation period.

The client is furious. They\'re threatening to leave. Their CTO is calling your CEO.

Your team says: "It was just a small change! How bad could it be?"

You know how bad it could be.`,
    choices: [
      {
        text: 'Roll back immediately and apologize',
        checks: { C: 9, A: 7 },
        success: { text: 'You roll back, apologize sincerely, and offer a migration plan. The client stays. They respect your professionalism.', effects: { C: 2, A: 1 }, log: 'Rollback saved the client!' },
        failure: { text: 'The client has already moved on. They\'re switching to a competitor.', effects: { C: -2, E: -2 }, log: 'Lost the client. 💀' }
      },
      {
        text: 'Offer a compatibility layer',
        checks: { I: 8, A: 7 },
        success: { text: 'You build a compatibility layer in 48 hours. The client migrates at their pace. Everyone\'s happy.', effects: { I: 1, A: 1 }, log: 'Compatibility layer saved the day!' },
        failure: { text: 'The compatibility layer has bugs. The client is even more frustrated.', effects: { I: -1, C: -1 }, log: 'Compatibility layer broke.' }
      }
    ]
  },
  {
    id: 'the_tech_stack_war',
    title: 'The Tech Stack War',
    phase: 2,
    phaseLabel: 'Mid-Level Developer — Month 23',
    narrative: `Your team is divided. Half wants to use Framework X. Half wants Framework Y.

Both sides are passionate. Both sides are right. Both sides are wrong.

The argument has been going on for 3 months. No progress is being made.

You\'re asked to break the tie.`,
    choices: [
      {
        text: 'Run a proof of concept for each',
        checks: { I: 7, A: 6 },
        success: { text: 'You build a POC with each framework. The data speaks for itself. The team agrees.', effects: { I: 1, A: 1 }, log: 'POC settled the debate!' },
        failure: { text: 'Both POCs are equal. The team is more divided than ever.', effects: { E: -2 }, log: 'POC didn\'t help.' }
      },
      {
        text: 'Flip a coin',
        checks: { L: 7, C: 5 },
        success: { text: 'You flip a coin. Heads wins. Everyone laughs. The team moves on.', effects: { L: 1, C: 1 }, log: 'Coin flip settled it. Team moved on.' },
        failure: { text: 'The team is offended by the coin flip. They want a real decision.', effects: { C: -1, E: -1 }, log: 'Coin flip offended everyone.' }
      }
    ]
  },
  {
    id: 'the_presentation',
    title: 'The Architecture Presentation',
    phase: 3,
    phaseLabel: 'Senior Developer — Month 41',
    narrative: `You\'ve designed a new architecture. It\'s elegant, scalable, and perfect.

You\'re presenting it to the engineering team. They have questions.

"What about latency?" "What about cost?" "What about our existing infrastructure?"

You didn\'t think about those.`,
    choices: [
      {
        text: 'Admit you didn\'t consider those factors',
        checks: { C: 7, I: 6 },
        success: { text: 'You admit the gaps. The team helps you fill them. The architecture gets better.', effects: { C: 1, I: 1 }, log: 'Admitted gaps. Architecture improved!' },
        failure: { text: 'You deflect. The team doesn\'t buy it. Your credibility takes a hit.', effects: { C: -1, E: -1 }, log: 'Deflected. Credibility hit.' }
      },
      {
        text: 'Push back on the concerns',
        checks: { C: 8, I: 7 },
        success: { text: 'You address each concern with data. The team is convinced. The architecture ships.', effects: { C: 1, I: 1 }, log: 'Data convinced the team!' },
        failure: { text: 'Your data is weak. The team pushes back harder. The architecture is delayed.', effects: { C: -1, E: -2 }, log: 'Data was weak. Delayed.' }
      }
    ]
  },
  {
    id: 'the_performance_crisis_2',
    title: 'The Performance Crisis II',
    phase: 4,
    phaseLabel: 'Staff/Principal — Month 75',
    narrative: `Your platform is slow. Really slow. Average page load: 8 seconds. Users are complaining. Churn is up 15%.

You\'ve been asked to "make it fast." No specifics. The CEO wants it "fixed by next sprint."

You open the profiler. The app makes 47 API calls per page load. Forty. Seven.

This is your final boss-level challenge.`,
    choices: [
      {
        text: 'Implement aggressive caching',
        checks: { I: 8, A: 7 },
        success: { text: 'You add Redis caching and reduce API calls from 47 to 3. Page load drops to 800ms. The CEO is thrilled.', effects: { I: 2, A: 1 }, log: 'Caching solved the crisis!' },
        failure: { text: 'You cache aggressively but introduce stale data bugs. Now you have TWO problems.', effects: { I: -1, E: -2 }, log: 'Cache caused new bugs.' }
      },
      {
        text: 'Rewrite the frontend',
        checks: { S: 7, A: 8 },
        success: { text: 'You identify the rendering bottleneck and optimize it. Performance improves 5x.', effects: { S: 1, A: 2 }, log: 'Frontend optimization succeeded!' },
        failure: { text: 'The bottleneck wasn\'t the frontend — it was the backend. You\'ve optimized nothing.', effects: { E: -2, P: -1 }, log: 'Wrong bottleneck identified.' }
      }
    ]
  },
  {
    id: 'the_hiring_freeze_2',
    title: 'The Hiring Freeze II',
    phase: 4,
    phaseLabel: 'Staff/Principal — Month 82',
    narrative: `The company is "right-sizing." There\'s a hiring freeze. But your team\'s workload just doubled.

You have 5 people doing the work of 10. Deadlines are unrealistic. Morale is at an all-time low.

Your team lead asks: "How are we going to handle this?"

You\'re the senior person. They\'re looking to you.`,
    choices: [
      {
        text: 'Prioritize ruthlessly and say no to everything else',
        checks: { C: 8, I: 7 },
        success: { text: 'You work with product to cut the scope in half. You protect your team from distraction. They deliver on the priorities.', effects: { C: 2, I: 1 }, log: 'Protected the team through the freeze!' },
        failure: { text: 'You try to do everything and so does your team. Everyone works weekends. Productivity drops.', effects: { E: -3 }, log: 'Tried to do everything. Failed.' }
      },
      {
        text: 'Automate the boring stuff',
        checks: { I: 9, A: 7 },
        success: { text: 'You identify automation opportunities. CI/CD improvements, automated testing, better tooling. The team becomes 2x more efficient.', effects: { I: 2, A: 2 }, log: 'Automation saved the team!' },
        failure: { text: 'Automation projects take time to build. In the short term, productivity drops.', effects: { E: -2, A: -1 }, log: 'Automation backfired (short term).' }
      }
    ]
  },
  {
    id: 'the_agile_transformation',
    title: 'The Agile Transformation',
    phase: 2,
    phaseLabel: 'Mid-Level Developer — Month 21',
    narrative: `The CEO just hired an "Agile Transformation Consultant." They cost $250,000.

Tomorrow, your team is going through "Agile." You\'ve never heard of it. Your team lead says it\'s "just Scrum but more."

You\'re told to attend a 4-hour "Agile Workshop" on a Friday. Your feature deadline is Monday.

The consultant says: "We\'re going to break out of our comfort zones!"`,
    choices: [
      {
        text: 'Embrace the workshops',
        checks: { E: 7, C: 6 },
        success: { text: 'You survive the workshops. You learn that "Agile" mostly means more meetings. But you\'re now "Agile Certified."', effects: { E: 1, C: 1 }, log: 'Survived the Agile transformation.' },
        failure: { text: 'The workshops are 8 hours each day. You miss your deadline. Your team hates you.', effects: { E: -2, A: -1 }, log: 'Agile workshops destroyed productivity.' }
      },
      {
        text: 'Sneak away and code',
        checks: { A: 7, L: 6 },
        success: { text: 'You sneak away to code. Nobody notices. You ship your feature on time. The consultant is fooled.', effects: { A: 1, L: 1 }, log: 'Code while others did team building.' },
        failure: { text: 'The consultant notices. You\'re called out in front of the team. Your manager is not happy.', effects: { C: -2, E: -1 }, log: 'Caught sneaking away.' }
      }
    ]
  },
  {
    id: 'the_sprint_ceremony',
    title: 'The Sprint Ceremony',
    phase: 2,
    phaseLabel: 'Mid-Level Developer — Month 24',
    narrative: `Your team is doing "Sprint Planning." The PM has 80 story points for a 2-week sprint. Your team\'s velocity is 30.

The Scrum Master says: "We can do it if we believe!"

Your team lead says: "Just say yes. We\'ll figure it out."

You know you\'ll be working weekends.`,
    choices: [
      {
        text: 'Push back with data',
        checks: { C: 7, I: 6 },
        success: { text: 'You present velocity data. The PM reduces the scope. The sprint is realistic. Your team survives.', effects: { C: 1, I: 1 }, log: 'Data saved the team from burnout!' },
        failure: { text: 'The PM says "we\'ll figure it out." You\'re stuck with 80 points. Weekend city.', effects: { E: -2, C: -1 }, log: 'Couldn\'t push back. 80 points.' }
      },
      {
        text: 'Say nothing and suffer',
        checks: { E: 6 },
        success: { text: 'You power through. It\'s brutal but you ship. Your team is exhausted but proud.', effects: { E: 1 }, log: 'Suffered in silence. Ship it.' },
        failure: { text: 'You can\'t keep up. The sprint fails. Your velocity drops. The Scrum Master adds more ceremonies.', effects: { E: -2, C: -1 }, log: 'Sprint failed. More ceremonies.' }
      }
    ]
  },
  {
    id: 'the_svpg_model',
    title: 'The SVPG Product Model',
    phase: 3,
    phaseLabel: 'Senior Developer — Month 42',
    narrative: `Your company is adopting the Silicon Valley Product Group (SVPG) model. The VP of Product just sent a 47-page deck.

It talks about "product-market fit," "the product lifecycle," and "the three horizons."

You don\'t know what any of this means. Your team lead says it means "product wants more features."

The new process: every feature needs a "Product Requirements Document" AND a "Success Metrics Framework" AND a "Go-to-Market Alignment."

Your simple bug fix now needs a 10-page doc.`,
    choices: [
      {
        text: 'Learn the framework',
        checks: { I: 8, E: 7 },
        success: { text: 'You read the deck. You understand the SVPG model. You write a PRD that actually helps. Product respects you.', effects: { I: 2, C: 1 }, log: 'Mastered the SVPG model!' },
        failure: { text: 'You read the deck. You don\'t understand it. You write a 10-page PRD that nobody reads.', effects: { E: -2, I: -1 }, log: 'Wrote a PRD nobody reads.' }
      },
      {
        text: 'Do the minimum required',
        checks: { A: 7, C: 5 },
        success: { text: 'You write a 2-page PRD. Product complains but approves it. You ship faster than everyone else.', effects: { A: 1, C: 1 }, log: 'Minimum viable PRD. Ship it.' },
        failure: { text: 'Product rejects your 2-page PRD. They want 10 pages. You\'re stuck in review for 2 weeks.', effects: { A: -1, E: -2 }, log: 'PRD rejected. Stuck in review.' }
      }
    ]
  },
  {
    id: 'the_product_triangle',
    title: 'The Product Triangle',
    phase: 3,
    phaseLabel: 'Senior Developer — Month 49',
    narrative: `Your VP of Product introduces the "Product Triangle": Fast, Good, Cheap. Pick two.

They say: "We want Fast AND Good. We\'re sorry, it\'s going to be expensive."

Your budget is cut 30%.

Your team lead says: "Just make it work."

The product team says: "We need it in 2 weeks."

The CEO says: "Make it great."

The Product Triangle is... a lie.`,
    choices: [
      {
        text: 'Show them the triangle',
        checks: { C: 8, I: 7 },
        success: { text: 'You draw the triangle on a whiteboard. Everyone understands. They pick "Good and Cheap" and give you more time.', effects: { C: 2, I: 1 }, log: 'Triangle explained. Time given.' },
        failure: { text: 'The VP says "we\'re special. We can break the triangle." Nobody believes them.', effects: { C: -1, E: -1 }, log: 'Triangle ignored. Impossible.' }
      },
      {
        text: 'Just build what they ask',
        checks: { E: 7, A: 6 },
        success: { text: 'You build it. It\'s fast, it\'s good, and it\'s expensive. Your team burns out but ships.', effects: { E: 1, A: 1 }, log: 'Built it. Team is exhausted.' },
        failure: { text: 'You can\'t make it work. The feature ships late, it\'s buggy, and it costs more than expected.', effects: { E: -2, C: -1 }, log: 'Late, buggy, expensive.' }
      }
    ]
  },
  {
    id: 'the_innovation_day',
    title: 'Innovation Day',
    phase: 1,
    phaseLabel: 'Junior Developer — Month 7',
    narrative: `It\'s company Innovation Day. Everyone is supposed to work on a passion project for 24 hours.

Your manager says: "You can work on anything! Just make sure it adds value to the company."

You have 24 hours. You have an idea. But you\'ve never built anything from scratch before.

Your coworker is building an AI-powered chatbot. Another is building a blockchain-based todo app.`,
    choices: [
      {
        text: 'Build a small but useful tool',
        checks: { A: 7, I: 6 },
        success: { text: 'You build a CLI tool that saves your team 2 hours per week. It\'s small but everyone loves it.', effects: { A: 1, I: 1 }, log: 'Built a useful tool. Team loves it!' },
        failure: { text: 'You build something that doesn\'t work. The demo is painful.', effects: { E: -1 }, log: 'Demo was painful.' }
      },
      {
        text: 'Build something ambitious',
        checks: { I: 7, E: 6 },
        success: { text: 'You build a microservice that becomes the foundation for future features. Your manager is impressed.', effects: { I: 2 }, log: 'Ambitious project paid off!' },
        failure: { text: 'You build something ambitious but unfinished. The demo shows a half-working prototype.', effects: { E: -2, A: -1 }, log: 'Ambitious but unfinished.' }
      }
    ]
  },
  {
    id: 'the_code_of_conduct',
    title: 'The Code of Conduct Incident',
    phase: 3,
    phaseLabel: 'Senior Developer — Month 46',
    narrative: `A team member makes an inappropriate comment in a public channel. It\'s not terrible, but it\'s not okay.

The team is divided. Some think it\'s no big deal. Others are offended.

Your manager says: "Handle this. You\'re a senior engineer."

It\'s your call.`,
    choices: [
      {
        text: 'Address it directly and privately',
        checks: { C: 8, E: 7 },
        success: { text: 'You talk to them privately. They apologize. The team moves on. Everyone respects your handling.', effects: { C: 2, E: 1 }, log: 'Handled it privately. Team respected you!' },
        failure: { text: 'You address it publicly. They get defensive. The situation gets worse.', effects: { C: -1, E: -2 }, log: 'Public confrontation backfired.' }
      },
      {
        text: 'Let HR handle it',
        checks: { E: 5, C: 4 },
        success: { text: 'HR handles it professionally. You\'re not involved. The team moves on.', effects: { E: 1 }, log: 'HR handled it.' },
        failure: { text: 'HR takes 2 weeks. The team is simmering. Your manager asks why you didn\'t step in.', effects: { C: -1, E: -1 }, log: 'HR was too slow.' }
      }
    ]
  },
  {
    id: 'the_deprecation',
    title: 'The Deprecation Notice',
    phase: 2,
    phaseLabel: 'Mid-Level Developer — Month 26',
    narrative: `A critical library your project depends on just announced it\'s being deprecated in 6 months.

There\'s no direct replacement. You\'ll need to find an alternative or build your own.

Your team says: "We\'ll deal with it later."

You know "later" never comes.`,
    choices: [
      {
        text: 'Start planning the migration now',
        checks: { I: 7, A: 6 },
        success: { text: 'You create a migration plan and present it to leadership. They approve the time. Migration goes smoothly.', effects: { I: 1, A: 1 }, log: 'Migration plan approved!' },
        failure: { text: 'Leadership says "we\'ll deal with it later." You start planning anyway. It takes 3x longer.', effects: { E: -1 }, log: 'Planning anyway. Took longer.' }
      },
      {
        text: 'Wait and deal with it later',
        checks: { E: 5, L: 5 },
        success: { text: 'You wait. A better replacement appears. You migrate in 2 weeks. Lucky break.', effects: { L: 1 }, log: 'Lucky break — better replacement appeared!' },
        failure: { text: 'You wait. The library stops working. You scramble to find a replacement. Chaos.', effects: { E: -2, L: -1 }, log: 'Library stopped working. Chaos.' }
      }
    ]
  },
  {
    id: 'the_sprint_retro',
    title: 'The Sprint Retrospective',
    phase: 1,
    phaseLabel: 'Junior Developer — Month 9',
    narrative: `Sprint retrospective. Your team missed every deadline this sprint.

The team lead asks: "What went wrong? What can we improve?"

You know the truth: the requirements changed 5 times. The senior dev was out for 2 weeks. The database was down for 3 days.

But if you say that, it sounds like you\'re making excuses.`,
    choices: [
      {
        text: 'Give honest but diplomatic feedback',
        checks: { C: 6, I: 5 },
        success: { text: 'You share the real issues diplomatically. The team agrees on process improvements. Next sprint is better.', effects: { C: 1, P: 1 }, log: 'Honest feedback led to improvements!' },
        failure: { text: 'Your feedback is taken as complaining. The team lead says "we need more accountability."', effects: { C: -1, E: -1 }, log: 'Feedback taken as complaining.' }
      },
      {
        text: 'Say nothing',
        checks: { E: 4 },
        success: { text: 'You stay quiet. The retro moves on. Nothing changes. You\'re back to square one next sprint.', effects: { E: 1 }, log: 'Stayed quiet. Nothing changes.' },
        failure: { text: 'The team lead calls on you. "What do you think?" You\'re caught off guard.', effects: { E: -1, C: -1 }, log: 'Caught off guard.' }
      }
    ]
  }
];

// Get random event for a given phase
function getRandomEvent(phase, excludeIds = []) {
  const phaseEvents = EVENTS.filter(e => e.phase === phase && !excludeIds.includes(e.id));
  if (phaseEvents.length === 0) return null;
  return phaseEvents[Math.floor(Math.random() * phaseEvents.length)];
}

// Get all events for a phase (for tracking)
function getPhaseEvents(phase) {
  return EVENTS.filter(e => e.phase === phase);
}

// Get boss event for a phase
function getBossEvent(phase) {
  return EVENTS.find(e => e.phase === phase && e.title.startsWith('BOSS:'));
}
