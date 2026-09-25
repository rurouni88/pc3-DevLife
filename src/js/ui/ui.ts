// UI composition — merges UICore (ui-core.js) with the section objects into
// the single UI object the rest of the game calls. Load order: ui-core.js
// and every ui-*.js section must load before this file.
const UI = Object.assign({}, UICore, UICharacter, UILevelUp, UIEndOfRun, UIEventCard, UITooltip, UIDice, UILeaderboard, UIAchievements, UIStatistics);
