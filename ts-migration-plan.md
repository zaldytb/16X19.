# TypeScript Migration Plan

## Current Architecture Map

The app is no longer a page-owned monolith, but it is still a compatibility-heavy
hybrid.

### Runtime layers

1. `src/engine/*`
   - Canonical prediction engine
   - Fully TypeScript-owned

2. `src/state/*`
   - `store.ts`: active and saved loadouts
   - `setup-sync.ts`: derive the live racquet/string setup from the active loadout
   - `app-state.ts`: shared runtime UI state and compatibility mirrors
   - `loadout.ts`: transitional state/loadout helpers still used by legacy and TS code

3. `src/ui/pages/*`
   - Primary TS owners for page behavior
   - `shell.ts` owns mode switching and runtime orchestration
   - `overview.ts` owns Overview rendering
   - `tune.ts` owns live Tune runtime
   - `compare/index.ts` owns the live Compare page
   - `optimize.ts`, `compendium.ts`, `strings.ts`, `find-my-build.ts`, `my-loadouts.ts` are active TS modules

4. `src/main.js`
   - Public bridge layer to `window.*`
   - Decides what the real runtime owner is for inline HTML handlers

5. `app.js`
   - Compatibility shell plus leftover legacy bodies
   - Still exports many helpers for boot, fallback, older flows, and bridge compatibility
   - Now much smaller and less authoritative than earlier in the migration

### Current ownership by feature

#### Fully or effectively TS-owned at runtime

- Engine and scoring
- Store and setup derivation
- Shell/mode switching
- Overview
- Tune
- Compare
- Optimize
- Compendium
- Strings
- Dock compare actions
- Most compare entrypoints from leaderboard, optimize, compendium, and shell

#### Still transitional

- `app.js` compatibility wrappers and duplicate leaf helpers
- `src/state/loadout.ts` vs older loadout helpers still exported from `app.js`
- `src/ui/pages/leaderboard.js` is still JavaScript
- Some compare compatibility mirrors still exist in `app-state.ts` for safety

## Current Monolith Status

- `app.js` is now about `7,940` lines
- The live bridge usually routes to TS first
- Compare is effectively off the monolith path
- The biggest remaining migration risk is no longer Compare
- The biggest remaining migration risk is stale duplicate logic in:
  - Tune leftovers in `app.js`
  - Overview leftovers in `app.js`
  - shell/bootstrap compatibility code in `app.js`
  - the still-JS leaderboard module

## What Is Already Done

- Shell ownership moved into `src/ui/pages/shell.ts`
- Overview render path moved into `src/ui/pages/overview.ts`
- Tune runtime and recommendation flows moved into `src/ui/pages/tune.ts`
- Compendium extracted into `src/ui/pages/compendium.ts`
- Strings extracted into `src/ui/pages/strings.ts`
- Compare rebuilt around `src/ui/pages/compare/index.ts`
- `src/ui/pages/compare.ts` reduced to a compatibility shim
- Compare entrypoints from dock, shell, optimize, compendium, and leaderboard now prefer the TS Compare APIs
- Compare quick-add prompt is now TS-owned
- Large legacy Compare bodies in `app.js` have been collapsed into delegate wrappers or no-ops

## Remaining Monolith Hotspots

### 1. Tune duplicates in `app.js`

Tune is stable now, but `app.js` still contains legacy Tune helpers and fallback render logic.
This is the highest-risk remaining duplicate page system because Tune is state-sensitive.

Key danger:
- one stale Tune helper can desync the delta card, OBS chip, WTTN, recommendations, and apply flow

### 2. Overview duplicates in `app.js`

Overview is TS-owned at runtime, but duplicate helpers still exist in the monolith.

Key danger:
- old Overview DOM writes can still create empty or stale UI if they get called from fallback paths

### 3. `leaderboard.js`

Leaderboard is functionally integrated, but it is still JavaScript and still part of the
legacy boundary.

Key danger:
- it keeps compare and shell integration straddling both modern and legacy coding styles

### 4. `app.js` compatibility exports and loadout helpers

`app.js` still exports many helpers because `src/main.js`, shell, and older UI flows need
them for compatibility.

Key danger:
- even if page ownership is fixed, `app.js` can remain a de facto second utility layer

## New Migration Phases

### Phase 1: Finish Tune Legacy Excision

Goal:
- make `src/ui/pages/tune.ts` the only real Tune implementation

Scope:
- dead-isolate remaining Tune render/apply helpers in `app.js`
- keep only thin compatibility wrappers where unavoidable
- ensure shell and bridge paths never fall back to old Tune logic during normal runtime

Success criteria:
- Tune behavior is entirely TS-owned
- no alternate Tune page logic remains active in `app.js`
- the following stay in sync:
  - delta card
  - OBS score in Tune
  - WTTN
  - recommended builds
  - loadout switching while Tune is open
  - slider-to-apply-button flow

### Phase 2: Finish Overview Legacy Excision

Goal:
- make `src/ui/pages/overview.ts` the only real Overview renderer

Scope:
- dead-isolate leftover Overview hero/stat/radar/fit/warnings helpers in `app.js`
- keep only wrapper exports if any compatibility surface still expects those names

Success criteria:
- no second Overview renderer remains in the monolith
- fit-grid, radar, warnings, and hero all come from TS only

### Phase 3: Convert Leaderboard to TypeScript

Goal:
- replace `src/ui/pages/leaderboard.js` with `leaderboard.ts`

Why now:
- compare integration is stable enough
- remaining risk has shifted from compare ownership to codebase consistency and monolith shrinkage

Scope:
- convert the leaderboard module
- preserve current compare integration through canonical Compare APIs
- preserve any app dependency injection that still matters

Success criteria:
- `src/main.js` bridges a TS leaderboard module
- leaderboard compare/save/view actions use the modern runtime contracts only

### Phase 4: Converge Loadout and Compatibility Helpers

Goal:
- reduce duplicated loadout/build helper ownership between `app.js` and `src/state/*`

Likely targets:
- `createLoadout`
- save/activate helper exports still duplicated across layers
- shared compare/build utility paths that still originate in `app.js`

Success criteria:
- state and loadout creation live in `src/state/*`
- `app.js` only re-exports those helpers when compatibility truly requires it

### Phase 5: Shrink `app.js` to Bootstrap + Compat

Goal:
- turn `app.js` into a small bootstrap and compatibility layer

Target shape:
- startup helpers
- bridge-safe compatibility shims
- temporary exports for inline handlers only where still necessary
- no active page runtimes

Success criteria:
- `app.js` is materially smaller
- page logic lives under `src/`
- migration risk is no longer dominated by duplicate runtime paths

## Recommended Execution Order

1. Finish Tune legacy excision
2. Finish Overview legacy excision
3. Convert `leaderboard.js` to TypeScript
4. Converge loadout and compatibility helpers
5. Reduce `app.js` to bootstrap + compat only

## Verification Gate

After each phase:

```bash
npm run typecheck
npm run canary
npm run build
```

Recommended manual checks:

- Overview:
  - hero
  - stat bars
  - radar
  - fit box
  - warnings
- Tune:
  - delta bars
  - OBS card
  - WTTN
  - recommendations
  - apply flow
- Compare:
  - slot persistence across mode switches
  - Tune / Save / Set Active / Edit actions
  - dock sync
- Entry flows from:
  - leaderboard
  - compendium
  - optimize
  - saved loadouts
  - dock

## Definition of Done

The migration is done when:

- all page runtimes are TS-owned
- `leaderboard` is TypeScript
- `app.js` is bootstrap and compatibility glue only
- `src/main.js` bridges one clear owner per public runtime surface
- automated verification passes without relying on legacy fallback behavior
