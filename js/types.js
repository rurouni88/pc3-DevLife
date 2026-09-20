// Shared type definitions for the DevLife codebase.
// This file contains JSDoc typedefs only — no runtime code. It is picked up
// by the TypeScript checker (tsconfig.json "include") and intentionally NOT
// loaded as a <script> in index.html.

/** A single SPECIAL stat letter. */
/** @typedef {'S' | 'P' | 'E' | 'C' | 'I' | 'A' | 'L'} StatKey */

/** All seven base stats. */
/** @typedef {Record<StatKey, number>} Stats */

/** Item rarity tiers (see RARITY_WEIGHTS in items.js). */
/** @typedef {'common' | 'uncommon' | 'rare' | 'epic'} Rarity */

/** Equipment — passive item with permanent stat bonuses. */
/** @typedef {Object} Equipment 
 * @property {string} id 
 * @property {string} name 
 * @property {string} emoji 
 * @property {Rarity} rarity 
 * @property {Partial<Stats>} effects 
 * @property {string} desc */

/** Consumable — one-time use stat boost (or risky multiplier). */
/** @typedef {Object} Consumable 
 * @property {string} id 
 * @property {string} name 
 * @property {string} emoji 
 * @property {Rarity} rarity 
 * @property {StatKey | 'any'} stat 
 * @property {number} bonus 
 * @property {number} [multiplier] 
 * @property {string} desc */

/** Result of using a consumable (multiplier fields only for AI tools). */
/** @typedef {Object} ConsumableUseResult
 * @property {string} id
 * @property {string} name
 * @property {string} emoji
 * @property {StatKey | 'any'} stat
 * @property {number} bonus
 * @property {number} [multiplier]
 * @property {string} [effective]
 * @property {boolean} [backfired] */

/** The outcome of a choice branch (success or failure). */
/** @typedef {Object} EventOutcome 
 * @property {string} text 
 * @property {Partial<Stats>} effects 
 * @property {string} log */

/** A player choice within an event. */
/** @typedef {Object} EventChoice 
 * @property {string} text 
 * @property {Partial<Record<StatKey, number>>} [checks] 
 * @property {EventOutcome} success 
 * @property {EventOutcome} failure */

/** A game event as defined in js/events/phase_*.json. */
/** @typedef {Object} GameEvent 
 * @property {string} id 
 * @property {string} title 
 * @property {number} phase 
 * @property {string} phaseLabel 
 * @property {string} narrative 
 * @property {EventChoice[]} choices */

/** The result of a single stat check roll. */
/** @typedef {Object} CheckResult 
 * @property {StatKey} stat 
 * @property {number} roll 
 * @property {number} target 
 * @property {number} effective 
 * @property {boolean} success 
 * @property {boolean} [negotiated] */

/** The return value of Game.processChoice.
 * On failure (unknown event/choice) only `error` is set.
 * `gameOver` is the death reason object, or null when the run continues.
 * @typedef {Object} ProcessResult
 * @property {string} [error]
 * @property {boolean} [success]
 * @property {CheckResult[]} [checkResults]
 * @property {Partial<Stats>} [effects]
 * @property {string} [log]
 * @property {Equipment | null} [itemDropped]
 * @property {boolean} [equipmentDropped]
 * @property {boolean} [leveledUp]
 * @property {{ reason: string } | null} [gameOver]
 * @property {boolean} [phaseComplete]
 * @property {boolean} [victory]
 * @property {boolean} [bossDefeated]
 * @property {boolean} [hasNegotiate]
 * @property {boolean} [hasBruteForce]
 * @property {boolean} [hasCodeReview]
 * @property {boolean} [cleanDeployUsed] */

/** A career log entry (most recent first). */
/** @typedef {Object} CareerLogEntry 
 * @property {string} message 
 * @property {number} day 
 * @property {number} timestamp */

/** The full mutable game state (Game.state). */
/** @typedef {Object} GameState 
 * @property {Stats} stats 
 * @property {Equipment[]} equipment 
 * @property {Consumable[]} consumables 
 * @property {number} level 
 * @property {number} levelUpPoints 
 * @property {number} day 
 * @property {number} phase 
 * @property {number} eventsCompleted 
 * @property {string | null} currentEventId 
 * @property {string[]} eventHistory 
 * @property {boolean} bossCompleted 
 * @property {CareerLogEntry[]} careerLog 
 * @property {boolean} alive 
 * @property {boolean} won 
 * @property {number} startTime 
 * @property {number} runNumber 
 * @property {Consumable[]} [pendingLevelUpConsumables] 
 * @property {Equipment | null} [pendingEquipmentDrop] */

/** A predefined starting build (archetypes.js). */
/** @typedef {Object} Archetype 
 * @property {string} name 
 * @property {string} description 
 * @property {Stats} stats */

/** PerkSystem snapshot for save/load. */
/** @typedef {Object} PerkSnapshot 
 * @property {string[]} active 
 * @property {boolean} bruteForceUsed 
 * @property {boolean} codeReviewUsed 
 * @property {boolean} negotiateUsed 
 * @property {boolean} cleanDeployUsed */

/** SpecialSystem snapshot for save/load. */
/** @typedef {Object} SpecialSnapshot 
 * @property {Stats} stats 
 * @property {Stats} equipmentBonuses */

/** The shape of a localStorage run save (SaveSystem). The SaveData class
 * in save.js validates this shape and wraps a valid instance. */
/** @typedef {Object} SaveDataShape
 * @property {GameState} state
 * @property {SpecialSnapshot} special
 * @property {PerkSnapshot} perks
 * @property {number} timestamp */

/** The shape of the devlife_meta localStorage entry (MetaStore). */
/** @typedef {Object} MetaState 
 * @property {number} [totalRuns] 
 * @property {string} [lastRunDate] 
 * @property {string[]} [startingEquipment] 
 * @property {string[]} [startingConsumables] */
