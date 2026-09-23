# Scope: Multi-Run Leaderboard (Phase 4)

## Goal
Show the top 10 runs per difficulty (Easy, Normal, Hard) in the Statistics screen.

## Data Model Changes

### `RunRecord` interface (new, in `types.ts`)
```typescript
interface RunRecord {
  seed: string;
  difficulty: Difficulty;
  day: number;
  won: boolean;
  archetype: string;
  stats: Stats;
  consumablesUsed: number;
  equipmentId: string | null;
}
```

### `MetaStore` changes (in `meta.ts`)

**New field on `MetaState`:**
- `runHistory?: RunRecord[]` — append-only array of completed runs

**New methods:**
- `recordRunComplete(equipmentId, result)` — now also pushes a `RunRecord` to `runHistory`
- `getTopRuns(difficulty: Difficulty, count: number): RunRecord[]` — returns top N runs for a difficulty, sorted by day (descending), then won before lost
- `getRunHistory(): RunRecord[]` — returns full history (for future use)

**Backward compatibility:**
- Old saves have no `runHistory` field → `getTopRuns()` returns empty array
- `resetStats()` now also clears `runHistory`

## UI Changes

### Option A: New section in Statistics screen (preferred)
Add a "Leaderboard" section below the lifetime stats in the existing Statistics screen (`screen-statistics`).

**Layout:**
```
┌──────────────────────────────────────┐
│  📊 Career Statistics                │
│  Your lifetime record across all runs │
├──────────────────────────────────────┤
│  [Lifetime stats table]              │
├──────────────────────────────────────┤
│  ── Easy ─────────────────────────── │
│  Rank │ Day │ Seed │ Won │ Archetype │
│  ─────────────────────────────────── │
│  1    │ 312 │ abc  │ ✓   │ Full P    │
│  2    │ 245 │ xyz  │ ✗   │ Code Monkey│
│  ...  │     │      │     │           │
├──────────────────────────────────────┤
│  ── Normal ───────────────────────── │
│  [same table]                        │
├──────────────────────────────────────┤
│  ── Hard ─────────────────────────── │
│  [same table]                        │
└──────────────────────────────────────┘
```

**CSS:**
- Reuse `.statistics-list` and `.stat-row-entry` classes
- New `.leaderboard-section` with header
- New `.leaderboard-table` with columns
- Truncate seed to 6 chars

### Option B: New Leaderboard screen
Separate screen (`screen-leaderboard`) with navigation from Statistics screen.

**Decision:** Option A is simpler, no new screen needed, keeps everything in one place.

## Files Changed

| File | Changes |
|------|---------|
| `src/js/types.ts` | Add `RunRecord` interface |
| `src/js/meta.ts` | Add `runHistory` field, update `recordRunComplete`, add `getTopRuns()` |
| `src/js/ui-statistics.ts` | Add leaderboard rendering |
| `src/css/style.css` | Leaderboard table styles |
| `test/core.tests.js` | New test: leaderboard records + top-N per difficulty |

## Estimated Effort
- **MetaStore changes:** ~1 hour
- **UI + CSS:** ~1 hour
- **Tests:** ~30 min
- **Total:** ~2.5 hours

## Dependencies
- None (builds on existing `MetaStore` + `Statistics` screen)
- **Version bump:** 0.44 (player-visible: leaderboard in Statistics screen)

## Acceptance Criteria
1. Top 10 runs displayed per difficulty in Statistics screen
2. Sorted by day (descending), won before lost as tiebreaker
3. Seed truncated to 6 chars
4. Empty state shown when no runs exist for a difficulty
5. `resetStats()` clears leaderboard data
6. All tests pass
7. Backward compatible with old saves (no `runHistory` field)
