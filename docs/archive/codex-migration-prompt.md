> **Archived — historical agent prompt.** Describes a pre–TS-only layout (`app.js`, `src/main.js`). Current entry is [`src/main.ts`](src/main.ts); see [`ts-migration-plan.md`](ts-migration-plan.md).

# Codex Prompt — Loadout Lab TypeScript Migration

## Your Role

You are executing a TypeScript migration plan for the **Loadout Lab** project (also called 16X19). The project is a physics-based tennis equipment analysis tool. The codebase is a Vite + TypeScript hybrid that still carries a large legacy `app.js` monolith. Your job is to systematically remove legacy code from `app.js`, consolidate ownership in the TypeScript modules under `src/`, and reduce `app.js` to a minimal bootstrap and compatibility layer.

---

## Critical Context

### Architecture

The app has two parallel layers that coexist:

1. **`src/` (TypeScript modules)** — the canonical owners of all page runtimes, state, and engine logic.
2. **`app.js` (~7,940 lines)** — a legacy monolith that still contains duplicate implementations of Tune, Overview, Optimize, Compendium, Strings, and more. Many of its functions delegate to `window.*` (which `src/main.js` has already bound to the TS modules), but the legacy bodies remain as dead or semi-live code.

### Bridge System

`src/main.js` (426 lines) is the **public bridge layer**. It:
- Imports all TS modules (shell, overview, tune, compare, optimize, compendium, strings, leaderboard, dock, shared)
- Assigns every public function to `window.*`
- Also imports all of `app.js` via `import * as App from '../app.js'` and spreads its exports to `window.*`

The TS module bindings in `main.js` **override** the `app.js` bindings because they are assigned later. This means for any function bridged from both sources, the TS version wins at runtime.

### Delegate Pattern in `app.js`

Many `app.js` functions follow this pattern:
```js
function someFunction(args) {
  if (typeof window.someFunction === 'function' && window.someFunction !== someFunction) {
    return window.someFunction(args);
  }
  // ... legacy body ...
}
```
This delegates to the TS version (via `window.*`) when available, falling back to the legacy body otherwise. Once we confirm the TS module is always bridged, the legacy body after the delegate check is dead code and can be removed.

### State Ownership

- `src/state/store.ts` — active loadout, saved loadouts
- `src/state/setup-sync.ts` — derives racquet/string config from loadout
- `src/state/app-state.ts` — shared UI state (currentMode, comparisonSlots, etc.)
- `src/state/loadout.ts` — transitional loadout helpers used by both layers

---

## Reference Files

Read these before starting any phase:
- `AGENTS.md` — project overview, debugging guidance, testing strategy
- `ts-migration-plan.md` — the plan you are executing
- `MIGRATION-CHECKLIST.md` — current migration status
- `src/main.js` — the bridge layer (must remain in sync with changes)

---

## Verified Hotspot Map in `app.js`

These are the exact line ranges containing the code you will be modifying:

| Section | Lines | Action |
|---------|-------|--------|
| Loadout system (createLoadout, activateLoadout, saveLoadout) | L89–L528 | Phase 4: Move to `src/state/` |
| Dock context panels | L530–L830 | Phase 5: Already bridged, keep as compat |
| Overview (renderDashboard, hero, stat bars, radar, fit, warnings) | L1787–L2401 | **Phase 2: Isolate/remove** |
| Compare delegates | L2403–L2511 | Already safe (thin delegates) |
| Hybrid/editor helpers | L2512–L2622 | Phase 5: Keep as compat |
| **Tune (full legacy body)** | **L2623–L4598** | **Phase 1: Isolate/remove** |
| Optimize | L4920–L5991 | Phase 5: Isolate after Tune/Overview |
| Compendium / Strings | L5993–L8141 | Phase 5: Isolate after Tune/Overview |

---

## Execution Plan

### Phase 1: Finish Tune Legacy Excision

**Goal:** Make `src/ui/pages/tune.ts` the only real Tune implementation.

**Scope:**
1. Open `app.js` lines 2623–4598 (the "TUNE MODE — TENSION TUNING LAB" section).
2. Identify every function that has the delegate pattern (`if (typeof window.X === 'function' && window.X !== X)`).
3. For each delegating function: **remove the legacy body** below the delegate check and keep only the delegate wrapper.
4. For functions that do NOT have the delegate pattern but ARE bridged from `src/main.js` to a TS equivalent: convert them to thin delegate wrappers.
5. For Tune state variables (`isTuneMode`, `_tuneRefreshing`, `sweepChart`, `tuneState`): keep them in `app.js` only if they are still referenced from non-Tune code. If only Tune uses them, remove them (the TS module has its own state).
6. Do NOT remove exports from the `export { }` block at the bottom of `app.js` unless the function itself was deleted.

**Key functions to collapse** (all at L2623–L4598):
- `toggleTuneMode` → already delegates, remove body
- `closeTuneMode` → already delegates, remove body
- `refreshTuneIfActive` → already delegates, remove body
- `initTuneMode` → check if delegates, collapse
- `onTuneSliderInput` → check if delegates, collapse
- `tuneSandboxCommit` → check if delegates, collapse
- `applyExploredTension` → check if delegates, collapse
- `renderDeltaVsBaseline` → check if delegates, collapse
- `renderGaugeExplorer` → check if delegates, collapse
- `renderSweepChart` → check if delegates, collapse
- `renderOptimalBuildWindow` → check if delegates, collapse
- `renderOverallBuildScore` → check if delegates, collapse
- `renderRecommendedBuilds` → check if delegates, collapse
- `renderWhatToTryNext` → check if delegates, collapse
- `renderExplorePrompt` → check if delegates, collapse
- `renderTuneHybridToggle` → check if delegates, collapse
- `renderOriginalTensionMarker` → check if delegates, collapse
- `renderOptimalZone` → check if delegates, collapse
- `renderBaselineMarker` → check if delegates, collapse
- `renderBestValueMove` → check if delegates, collapse
- `updateSliderLabel` → check if delegates, collapse
- `updateDeltaTitle` → check if delegates, collapse
- `_recomputeExploredState` → check if delegates, collapse
- `_updateTuneApplyButton` → check if delegates, collapse

For any function that does NOT have a delegate check but IS bridged from `src/main.js`:
```js
// Before:
function renderGaugeExplorer(setup) {
  // ...300 lines of legacy implementation...
}

// After:
function renderGaugeExplorer(setup) {
  if (typeof window.renderGaugeExplorer === 'function' && window.renderGaugeExplorer !== renderGaugeExplorer) {
    return window.renderGaugeExplorer(setup);
  }
}
```

**Verify:** Cross-reference each function against `src/main.js` to confirm it IS bridged to the TS module before collapsing.

**Success criteria:**
```bash
npm run typecheck
npm run canary
npm run build
```
Then manually verify in browser (via `npm run dev`):
- Delta card renders correctly
- OBS score in Tune updates on slider movement
- WTTN (What To Try Next) panel renders
- Recommended builds panel renders
- Apply button flow works (slider → apply → loadout updates)
- Loadout switching while Tune is open refreshes correctly

---

### Phase 2: Finish Overview Legacy Excision

**Goal:** Make `src/ui/pages/overview.ts` the only real Overview renderer.

**Scope:**
1. Open `app.js` lines 1787–2401 (the "MAIN DASHBOARD RENDER" and "OVERVIEW 4-CARD GRID" sections).
2. Apply the same delegate/collapse pattern as Phase 1.
3. Key functions to collapse:
   - `renderDashboard` — already delegates via `window.renderDashboard`
   - `_renderDashboardLegacy` — the fallback body, keep only if `renderDashboard` delegate needs it
   - `renderOverviewHero` — has TS equivalent bridged from `overview.ts`
   - `renderStatBars` — has TS equivalent
   - `renderRadarChart` — has TS equivalent
   - `renderFitProfileActive` → `renderFitProfile` in TS bridge
   - `renderOCFoundation` — has TS equivalent
   - `renderOCSnapshot` — has TS equivalent
   - `renderWarnings` — has TS equivalent
   - `generateFitProfile` — has TS equivalent
   - `generateWarnings` — has TS equivalent
   - `getRatingDescriptor` — has TS equivalent
   - `renderBuildDNAHighlights` — has TS equivalent
4. Keep `getCurrentSetup()` and `_getSetupFromEditorDOM()` — these are used by many sections, not just Overview.

**Success criteria:**
```bash
npm run typecheck
npm run canary
npm run build
```
Verify Overview page renders: hero, stat bars, radar, fit-grid, and warnings.

---

### Phase 3: Convert Leaderboard to TypeScript

**Goal:** Replace `src/ui/pages/leaderboard.js` (50,365 bytes) with `leaderboard.ts`.

**Scope:**
1. Rename `leaderboard.js` → `leaderboard.ts` (or create a new `.ts` file and migrate).
2. Add TypeScript type annotations. Use the existing types/interfaces from `src/engine/` and `src/state/` where possible.
3. Update imports in `src/main.js` to reference `leaderboard.ts` (Vite resolves `.ts` transparently, but the import path should be clean).
4. Preserve all existing exports — the `main.js` bridge spreads them to `window.*`.
5. Preserve the `initLeaderboardApp(App)` dependency injection pattern if still needed, or replace with direct imports from `src/state/` and `src/engine/`.

**Success criteria:**
```bash
npm run typecheck  # leaderboard.ts must pass strict mode
npm run canary
npm run build
```
Verify leaderboard page loads, compare/save/view actions work.

---

### Phase 4: Converge Loadout and Compatibility Helpers

**Goal:** Move loadout creation/management from `app.js` into `src/state/`.

**Key targets** (all in `app.js` L89–L528):
- `createLoadout` (L173–L233) → move to `src/state/loadout.ts`
- `activateLoadout` (L235–L268) → move to `src/state/loadout.ts` or `src/ui/pages/shell.ts`
- `saveLoadout` / `saveActiveLoadout` / `resetActiveLoadout` → move to `src/state/loadout.ts`
- `switchToLoadout` → move to `src/state/loadout.ts` or shell
- `hydrateDock` → move to dock component module
- `commitEditorToLoadout` → already bridged from shell, collapse `app.js` body

**Process:**
1. For each function, check if a TS equivalent already exists in `src/state/loadout.ts` or `src/ui/pages/shell.ts`.
2. If yes: collapse the `app.js` version to a delegate wrapper.
3. If no: extract it into the appropriate TS module, import it into `app.js`, and re-export it.
4. Update `src/main.js` bridge if new TS exports are added.

**Success criteria:**
```bash
npm run typecheck
npm run canary
npm run build
```
State and loadout creation should live in `src/state/*`. `app.js` only re-exports when compatibility requires it.

---

### Phase 5: Shrink `app.js` to Bootstrap + Compat

**Goal:** Turn `app.js` into a small bootstrap and compatibility layer.

**Remaining large sections to address:**
- Optimize (L4920–L5991, ~1,071 lines) — `src/ui/pages/optimize.ts` already owns runtime
- Compendium/Strings (L5993–L8141, ~2,148 lines) — `compendium.ts` and `strings.ts` already own runtime
- FMB/Quiz helpers (L8142–L8600) — `find-my-build.ts` already owns runtime
- Dock panels (L530–L830) — dock components in `src/ui/components/` already own runtime

Apply the same delegate-collapse pattern from Phases 1–2 to all remaining sections.

**Target shape for `app.js` after Phase 5:**
- Imports from `src/` modules
- `_store` (localStorage reference)
- `getCurrentSetup()` + `_getSetupFromEditorDOM()` — still needed as shared helpers
- `switchMode()` compatibility wrapper
- `_syncLegacyModeState()` — for mode state mirroring
- `init()` — delegates to `window.init`
- Thin delegate wrappers for any inline HTML handlers not yet migrated
- Export block
- DOMContentLoaded bootstrap

**Success criteria:**
```bash
npm run typecheck
npm run canary
npm run build
```
`app.js` should be materially smaller (target: under 1,500 lines). All page runtimes should live under `src/`.

---

## Safety Rules

1. **Never delete an export** from `app.js` unless you have confirmed no code (including `index.html` inline handlers) references it.
2. **Never change `src/main.js`** bridge bindings unless you are adding new TS module exports.
3. **Always keep the delegate pattern intact** when collapsing — the `typeof window.X === 'function' && window.X !== X` guard prevents infinite recursion.
4. **Run all three verification commands** (`typecheck`, `canary`, `build`) after each phase.
5. **Do not modify `data.js`** — it is generated from the pipeline.
6. **Do not change the prediction engine** (`src/engine/*`) — it is already fully migrated.
7. **Commit after each passing phase** with a descriptive message like `migration: phase 1 — tune legacy excision`.

## Verification Gate (after every phase)

```bash
npm run typecheck
npm run canary
npm run build
```

If any command fails, stop and diagnose before proceeding.
