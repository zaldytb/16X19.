# React migration plan (Strangler Fig status + next steps)

This document tracks what is already React and the forward roadmap for migrating remaining imperative `src/ui/pages/*.ts` UI into declarative React using the same patterns.

It must be read together with:

- [REACT-MIGRATION-GUIDE.md](./REACT-MIGRATION-GUIDE.md) - authoritative Zero-Pixel Protocol
- the repo docs in [../README.md](../README.md), [../AGENTS.md](../AGENTS.md), and [../CLAUDE.md](../CLAUDE.md)

---

## Current architecture pattern

Across the repo, migrated surfaces follow the same rules:

1. `createRoot(container).render(...)` from the owning legacy `.ts` module, not a second app root
2. `_ensure*ReactRoot` invalidation when lazy routes unmount and hosts are recreated
3. `flushSync` only when imperative follow-up in the same tick needs committed DOM (see **SearchableSelect contract** below)
4. pure view-model builders in `*-vm.ts`
5. props-only leaf components under `src/components/<workspace>/`

---

## Tune workspace (completed)

Tune remains orchestrated by `src/ui/pages/tune.ts`, but its major presentation surfaces are React:

| Area | React component(s) | View-models / helpers | Mount host(s) |
| --- | --- | --- | --- |
| Optimal build window | `OptimalBuildWindow` | `tune-optimal-build-window-vm.ts` | `#optimal-content` |
| Build score (OBS) | `TuneObsBuildScore` | `tune-obs-build-score-vm.ts` | `#obs-content` |
| Hybrid dimension toggle | `TuneHybridDimToggle` | `tune-hybrid-dim-toggle-vm.ts` | `#tune-hybrid-toggle` |
| Delta vs baseline | `TuneDeltaVsBaseline` | `tune-delta-vs-baseline-vm.ts` | `#delta-content` |
| Gauge explorer | `TuneGaugeExplorer` | `tune-gauge-explorer-vm.ts` | `#gauge-explore-content` |
| Recommended builds | `TuneRecommendedBuilds` | `tune-recommended-builds-vm.ts` | `#recs-content` |
| What to try next | `TuneWttn` | `recommendations.ts` | `#wttn-content` |
| Explore prompt | `TuneExplorePrompt` | `tune-explore-prompt-vm.ts` | `#explore-content` |
| Best value callout | `TuneBestValueCallout` | `tune-best-value-vm.ts` | `#slider-best-value` |
| Slider adornments | `TuneSliderAdornments` | `tune-slider-adornments-vm.ts` | `#tune-slider-adornments-root` |
| Sweep chart | `TuneSweepChart` | `tune-sweep-chart.ts` | `#sweep-chart-root` |

Still imperative: sweep orchestration, slider flow, apply logic, and route/runtime orchestration in `tune.ts`.

---

## Overview workspace (completed)

Overview is orchestrated by `src/ui/pages/overview.ts` with React islands for the dashboard surfaces:

| Area | React component(s) | View-models / helpers | Mount host(s) |
| --- | --- | --- | --- |
| Hero + CTAs | `OverviewHero` | `overview-hero-vm.ts` | `#overview-hero` |
| Stat bars | `OverviewStatBars` | `overview-stat-bars-vm.ts` | `#stat-bars` |
| Build DNA highlights | `OverviewBuildDnaHighlights` | `overview-build-dna-vm.ts` | `#build-dna-highlights` |
| Radar chart | `OverviewRadarChart` | `overview-radar-chart.ts` | `#radar-chart-root` |
| OC foundation | `OverviewOCFoundation` | `overview-oc-foundation-vm.ts` | `#oc-foundation` |
| Fit profile card | `OverviewFitProfileCard` | `overview-fit-profile-vm.ts` | `#fit-grid` |
| Warnings | `OverviewWarnings` | `overview-warnings-vm.ts` | `#warnings-list` |

Still imperative: `renderOCSnapshot`, legacy `renderFitProfile` compatibility, delegated actions, and workspace orchestration in `overview.ts`.

---

## Find My Build (partial)

Wizard orchestration remains in `src/ui/pages/find-my-build.ts`. `FmbWizardBody` composes dumb step panels (`FmbWizardSteps.tsx`: `FmbStepSwing` … `FmbStepResult`) so IDs (`fmb-step-1` … `fmb-step-5`, `fmb-result`) stay stable for delegation. Result surfaces are React islands mounted into the Overview hosts.

| Area | React component(s) | View-models / helpers | Mount host(s) |
| --- | --- | --- | --- |
| Wizard shell + nav chrome | `FmbWizardBody` | n/a | `#find-my-build` |
| Step panels (dumb) | `FmbStepSwing`, `FmbStepBall`, `FmbStepCourt`, `FmbStepPainPoints`, `FmbStepPriorities`, `FmbStepResult` | n/a | (inside `#find-my-build`) |
| Profile summary card | `FmbResultsSummary` | `find-my-build-vm.ts` (`buildFmbSummaryViewModel`) | `#fmb-summary` |
| Recommended frames + build rows + optimizer CTA | `FmbResultsDirections` | `find-my-build-vm.ts` (`buildFmbDirectionsViewModel`) | `#fmb-directions` |

Still imperative: step transitions, progress bar updates, answer selection, next/back gating, delegated result actions, and optimizer handoff population.

---

## Compendium / Strings / Leaderboard (partial)

### Racket Bible (`compendium.ts`)

| Area | React component(s) | View-models / helpers | Mount host(s) |
| --- | --- | --- | --- |
| Hero + spec grid + pills | `CompendiumRacketHero` | `comp-racket-hero-vm.ts` | `#comp-react-hero-root` |
| Base frame profile | `CompendiumBaseProfile` | `comp-base-profile-vm.ts` | `#comp-react-base-profile-root` |
| Top builds | `CompendiumTopBuilds` | `comp-top-builds-vm.ts` | `#comp-react-top-builds-root` |
| HUD roster | `CompendiumFrameRoster` | `comp-hud-filters-vm.ts` (`filterRacquetsForHud`, `readCompFrameHudFiltersFromDom`) | `#comp-frame-list` |
| String modulator shell | `CompendiumStringModulator` | n/a | `#comp-react-string-modulator-root` |
| Frame HUD shell (search + filters + roster host) | `CompendiumFrameHud` | n/a | `#comp-hud` (from `Compendium.tsx`) |

Still imperative: roster React mount scheduling, `createSearchableSelect` for modulator hosts, string injector init, preview computation, and delegated actions. Filter **predicates** no longer read the DOM inside the filter function; snapshot state is read once per roster render via the HUD filter VM.

### Strings tab (`strings.ts`)

| Area | React component(s) | View-models / helpers | Mount host(s) |
| --- | --- | --- | --- |
| Detail surface | `StringCompendiumDetail` | `string-compendium-detail-vm.ts` | `#string-react-detail-root` |
| HUD list | `StringCompendiumRoster` | `string-hud-filters-vm.ts` (`filterStringsForHud`, `readStringHudFiltersFromDom`) | `#string-list` |
| Frame injection modulator shell | `StringFrameInjectionModulator` | n/a | `#string-react-frame-modulator-root` |
| String HUD shell | `StringCompendiumHud` | n/a | `#string-hud` (from `Compendium.tsx`) |

Still imperative: roster React mount scheduling, `createSearchableSelect`, preview bars, change delegation, and modulator init. Filter predicates use the string HUD filter VM (same pattern as frames).

### Leaderboard (`leaderboard.ts`)

| Area | React component(s) | View-models / helpers | Mount host(s) |
| --- | --- | --- | --- |
| Filter / stat shell | `LeaderboardShell` | `leaderboard-shell-vm.ts` | `#lb2-shell-react-root` |
| Builds table | `LeaderboardBuildResults` | `leaderboard-results-vm.ts` | `#lb2-build-results-react` |
| Frames table | `LeaderboardFrameResults` | `leaderboard-results-vm.ts` | `#lb2-frame-results-react` |
| Strings table | `LeaderboardStringResults` | `leaderboard-results-vm.ts` | `#lb2-string-results-react` |

Still imperative: scheduling, count text updates, and delegated filter/button actions.

---

## Compare workspace (largely migrated)

Compare is orchestrated by `src/ui/pages/compare/index.ts` with React islands for the major panels:

- slot grid
- radar
- diff battery
- quick-add prompt
- slot editor modal

See `src/components/compare/` and `compare-*-vm.ts`.

Still imperative: page orchestration, subscriptions, shell callback registration, and remaining non-React chrome/delegation.

---

## My Loadouts dock list (partial)

The dock list is now React, mounted by `src/ui/pages/my-loadouts.ts` into the existing dock host in `BuildDock.tsx`.

| Area | React component(s) | View-models / helpers | Mount host(s) |
| --- | --- | --- | --- |
| Saved loadout list + delete-confirm state | `MyLoadoutsList` | `my-loadouts-vm.ts` (`buildMyLoadoutsViewModel`) | `#dock-myl-list` |

Still imperative: callback registration, delegated click listener binding, and the outer dock shell/actions.

---

## Optimize workspace (partial)

The page shell remains `src/pages/Optimize.tsx` and orchestration remains in `src/ui/pages/optimize.ts`.

| Area | React component(s) | View-models / helpers | Mount host(s) |
| --- | --- | --- | --- |
| Frame / lock / exclude searchable dropdowns | `OptimizeSearchDropdown` | `optimize-search-helpers.ts` (`filterOptSearchItems`) | `#opt-react-frame-search-root`, `#opt-react-lock-search-root`, `#opt-react-exclude-search-root` |
| Loading / empty / results table / tension filter | `OptimizeResultsTable` | `optimize-results-vm.ts` (`buildOptimizeResultsViewModel`) | `#opt-results` |
| Material / brand multiselect checklists | `OptimizeMultiselectChecks` | `optimize-filters-vm.ts` | `#opt-material-checks`, `#opt-brand-checks` |
| Exclude string tags | `OptimizeExcludeTags` | `optimize-filters-vm.ts` (`buildOptimizeExcludeTagsVm`) | `#opt-exclude-tags` |
| Upgrade mode checkbox | `OptimizeUpgradePanel` | (controlled in `optimize.ts`) | `#opt-react-upgrade-checkbox-root` |

Still imperative: hybrid lock + setup toggles, stat minimums + tension inputs, mobile filter toggle injection, optimizer run loop (reads hidden inputs populated by React), and document-level `data-opt-action` delegation.

---

## What is left

| Area | Status |
| --- | --- |
| Tune / Overview | Migrated |
| Compare | Core panels are React; follow-ups are incremental |
| Compendium | Main surfaces + HUD shells + roster lists are React; **SearchableSelect** modulator hosts stay vanilla (see contract below) |
| Optimize | Results + searchable dropdowns + filter islands are React; run loop and toggles remain imperative |
| Find My Build | Wizard shell, step panels, and results are React; wizard state machine remains imperative |
| My Loadouts | Dock list is React; callback bridge and delegation remain imperative |
| Shell | Already React |

Do not rewrite a whole page in one PR. Continue one widget or bounded cluster at a time.

---

## SearchableSelect contract (completion standard)

Compendium and Strings mount **vanilla** `createSearchableSelect` from `src/ui/components/searchable-select.ts` after React has committed the modulator host subtree. The required pattern is:

1. **Commit first:** wrap the React render that owns the host container in `flushSync` from `react-dom` so the container exists before init.
2. **Init once per committed host:** call `createSearchableSelect` with the same options API the module already uses.
3. **Teardown on re-render:** call `disposeSearchableSelectContainer` (or the module’s existing dispose path) before the next `createSearchableSelect` when the host is about to be replaced.

A thin React wrapper around the container is **optional** and only worth a spike if you need to deduplicate `flushSync` boilerplate; it is **not** required for migration “complete” status. Keyboard behavior and class strings in `searchable-select.ts` have high parity risk if reimplemented.

---

## Suggested next moves

1. Incremental polish: further lift HUD filter **UI** into controlled React if we ever need to remove remaining `read*HudFiltersFromDom` snapshots (optional; VMs already isolate predicates).
2. Optional `SearchableSelectHost.tsx` spike only if duplicate `flushSync` patterns become painful.
3. Continue one bounded cluster per PR for any new surfaces.

---

## Coordinator and refresh plans

`src/runtime/coordinator.ts` `RefreshPlan` includes `compendium` plus overview/tune/compare flags. Extend it only when a new migrated surface actually needs coordinated refresh behavior, and keep `tests/runtime-hardening.test.ts` in sync.

---

## Definition of done (per widget PR)

- isolated migration: one widget or one clearly bounded cluster
- JSX matches legacy structure and class strings unchanged unless byte-identical output is intended
- no new `window.*` globals
- `npm run typecheck`
- `npm run canary`
- `npm run build`
- `npm run test:runtime` if refresh contracts changed

---

## Changelog

- 2026-04: Tune widgets documented as the baseline Strangler Fig pattern
- 2026-04: Overview dashboard migrated
- 2026-04-01: Compendium / Strings / Leaderboard islands migrated
- 2026-04-01: My Loadouts dock list migrated
- 2026-04-01: Find My Build result surfaces migrated
- 2026-04-01: Optimize results surface migrated
- 2026-04-02: Optimize filter islands: `OptimizeMultiselectChecks`, `OptimizeExcludeTags`, `OptimizeUpgradePanel` + `optimize-filters-vm.ts`, `optimize-search-helpers.ts` (`filterOptSearchItems`); `flushSync` for material/brand; upgrade numeric fields stay in `Optimize.tsx` for stable IDs
- 2026-04-02: Compendium HUD shells extracted to `CompendiumFrameHud` / `StringCompendiumHud` in `src/components/compendium/`
- 2026-04-02: Find My Build wizard markup extracted to `FmbWizardBody` (`src/components/find-my-build/FmbWizardBody.tsx`)
- 2026-04-01: Optimize frame / lock / exclude search: `OptimizeSearchDropdown` + hosts in `Optimize.tsx`; `optimize-search-helpers.ts` shared filtering
- 2026-04-01: Compendium + Strings HUD filtering: `comp-hud-filters-vm.ts`, `string-hud-filters-vm.ts` (pure predicates + DOM snapshot helpers)
- 2026-04-01: Find My Build step panels split to `FmbWizardSteps.tsx` (composed by `FmbWizardBody`)
- 2026-04-01: Documented SearchableSelect + `flushSync` + dispose as the completion contract (`REACT-MIGRATION-PLAN.md` SearchableSelect section)
