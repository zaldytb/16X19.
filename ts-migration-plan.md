# TypeScript Migration Plan

## Current State

The migration is in a late transitional phase.

What is already live through TypeScript-owned bridge entrypoints:
- shell and mode orchestration
- overview runtime
- tune runtime
- compare runtime
- optimize
- compendium
- string compendium

What is still legacy-heavy:
- `app.js` still contains duplicate implementations and compatibility wrappers
- Tune recommendation content still comes from `app.js`
- `leaderboard.js` is still JavaScript
- some shared rendering and preset utilities still exist in both TS and legacy paths

## Main Goal

Reduce `app.js` from a compatibility monolith into a thin bootstrap layer that:
- imports modules
- exposes compatibility shims where still necessary
- initializes the app

## Guiding Principle

Do not migrate by file name alone. Migrate by runtime ownership.

A phase is only done when:
1. the live `window.*` bridge points to the TS implementation
2. the surrounding flows use the same state source
3. the legacy `app.js` version is no longer the active path

## Remaining Work

### Phase A: Finish Tune Content Ownership

Goal:
- move the remaining Tune recommendation content out of `app.js`

Still legacy-sourced today:
- `renderRecommendedBuilds`
- `renderWhatToTryNext`
- `renderExplorePrompt`
- related recommendation helpers used only by Tune

Why this is next:
- Tune runtime is already TS-owned
- the remaining risk is content/render duplication, not control-flow ownership
- finishing Tune fully removes one of the most regression-prone mixed systems

Success criteria:
- Tune slider, delta card, OBS card, WTTN, recommended builds, and apply flow all come from the TS page module
- `app.js` only forwards or no longer owns Tune rendering

### Phase B: Delete or Dead-Code-Isolate Legacy Compare and Tune Duplicates

Goal:
- remove inactive compare and tune implementations from `app.js`

Scope:
- legacy compare renderers and helpers now shadowed by `compare.ts`
- legacy tune runtime and renderer functions now shadowed by `tune.ts`

Strategy:
- keep wrapper entrypoints only if older flows still call them
- delete dead leaf renderers first
- verify the bridge remains stable after each removal

Success criteria:
- `app.js` no longer contains active compare/tune page logic

### Phase C: Finish Overview Cleanup

Goal:
- remove remaining duplicate overview renderers that are no longer needed

Scope:
- legacy overview leaf helpers still present in `app.js`
- any duplicate fit/warning/radar helpers that are now TS-owned

Success criteria:
- overview is TS-owned both publicly and internally
- `app.js` is no longer a hidden fallback for overview rendering

### Phase D: Convert Leaderboard to TypeScript

Goal:
- replace `src/ui/pages/leaderboard.js` with `leaderboard.ts`

Why this is later:
- leaderboard is more self-contained
- the bigger current risk is still duplicate runtime ownership elsewhere

Success criteria:
- leaderboard builds and runs through TypeScript
- `src/main.js` bridges the TS version directly

### Phase E: Shared Utility and Preset Cleanup

Goal:
- consolidate helpers that still exist in both legacy and TS paths

Likely targets:
- recommendation helpers
- preset rendering/storage helpers
- duplicated shared renderers

Success criteria:
- one authoritative owner per shared helper
- fewer bridge collisions

### Phase F: Thin Bootstrap `app.js`

End state target for `app.js`:
- bootstrap/init only
- compatibility wrappers only where truly needed
- no large page-level render systems

Target outcome:
- `app.js` becomes a small shell instead of a working implementation dump

## Recommended Execution Order

1. Finish Tune content ownership
2. Remove legacy Tune duplicates
3. Remove legacy Compare duplicates
4. Finish Overview cleanup
5. Convert Leaderboard to TypeScript
6. Consolidate shared utilities
7. Shrink `app.js` to bootstrap level

## Verification Gate

After each phase:

```bash
npm run typecheck
npm run canary
npm run build
```

Manual smoke checks:
- create, save, activate, reset, and duplicate loadouts
- switch across Overview, Tune, Compare, Optimize, Compendium, and Strings
- verify Tune slider, delta bars, OBS card, WTTN, and apply flow
- verify Compare slots, verdicts, and radar
- verify Compendium and Strings actions still save, activate, and compare correctly

## Risks to Watch

- fixing a legacy function that is no longer the live path
- bridge collisions in `src/main.js`
- split state between `app.js`, `app-state.ts`, and store-backed loadouts
- Chart.js instance reuse bugs when ownership changes
- hidden DOM/CSS dependencies that were previously masked by old renderers

## Definition of Done

The migration is done when:
- all page runtime ownership is in TypeScript
- shared app state is centralized in TS modules
- `app.js` is a thin compatibility/bootstrap layer
- the full verification gate passes without special fallback wiring
