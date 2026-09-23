# Tech Debt — assessment

Assessment of external codebase feedback, grounded in the current source
(`src/js/`, ~3.7k lines). Split into three buckets: worth acting on, accepted
(by-design tradeoffs), and stale/minor.

## Worth acting on (real, good ROI)

- [ ] **Engine → UI coupling.** `game.ts` (the engine) calls `UI.showToast(...)`
      and `UI.renderPerks()` inside `refreshPerks()`. The engine should be
      pure/testable; instead it reaches into the UI to announce perk changes.
      Fix: have `refreshPerks()` / `applyChoice()` *return* the `gained`/`lost`
      perk ids and let the UI fire the toasts and re-render. Contained change;
      cleans up the one real leak in the boundary.
- [ ] **Direct `Math.random()` usage.** Inconsistent: `d20()`/`dRoll()`/`shuffle()`
      wrap randomness in `utils.ts`, but `game.ts` calls `Math.random()` directly
      in 4 places (day advance, drop rate, probabilistic-redundancy roll, AI
      backfire). Tests pass only because the harness overrides `Math.random`
      globally. Fix: route those through a `chance(p)` helper in `utils` so the
      random surface is consistent and seedable. Low effort.

## Accepted (by-design tradeoffs, not debt)

- **Global namespace.** Deliberate decision from the TS migration — files stay
  as scripts (no `import`/`export`) to preserve the global-scope model and keep
  the VM test harness (concatenate-in-order) working. Known cost (no explicit
  dependency graph, load order matters), not accidental rot. Converting to real
  ES modules is a large refactor for marginal gain at this scale.
- **Direct DOM mutation.** It's a vanilla, dependency-free game — direct DOM
  manipulation *is* the architecture. Frameworks were evaluated and rejected as
  the wrong tool.
- **No single state-management boundary.** There *is* a deliberate separation:
  run state (`Game.state`), career/meta (`MetaStore`), stats (`SpecialSystem.stats`),
  perks (`PerkSystem`). A Redux-style single store doesn't fit a game this size.
  Acceptable as-is.

## Stale / minor

- **"A very large UI module" — partly stale.** The UI was already split
  (PR #24) into `ui.ts` + `ui-character` / `ui-levelup` / `ui-endofrun`. The core
  `ui.ts` is still the biggest file (1100+ lines) and does a lot (event card,
  choices, consumables, results, tooltips, difficulty, toasts). Could be split
  further (e.g. `ui-event`, `ui-tooltip`). Fair, medium priority.
- **Broad string APIs — minor.** The clearest one is
  `showConsumableSelection(type: string)` where `type` is really
  `'gameover' | 'victory'`. Worth tightening to a union; the rest are fine.

## Bottom line

Two items are genuinely worth doing and are cheap: the **engine → UI leak** and
**consolidating `Math.random`**. The other five are either deliberate tradeoffs
we already made consciously (globals, DOM, state) or stale/minor (UI size, string
APIs). Do the two, note the rest as "accepted," and don't chase the
framework-style reframes.
