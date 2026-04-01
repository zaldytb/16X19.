# React migration plan (post–Tune workspace)

This document is the **forward roadmap** for continuing the Strangler Fig migration of imperative `src/ui/pages/*.ts` UI into declarative React, **after** the Tune workspace conversion.

It **must** be read together with:

- **[REACT-MIGRATION-GUIDE.md](./REACT-MIGRATION-GUIDE.md)** — authoritative Zero-Pixel Protocol (no visual drift, widget-by-widget, dumb components + pure view-models).
- **Zero-Pixel acknowledgment** — the same non‑negotiables summarized in the Cursor plan “Zero-Pixel Protocol Ack” (widget scope, `createRoot` inside legacy modules, 1:1 DOM/Tailwind, store separation, quality gates). Repository coding agents should treat `docs/REACT-MIGRATION-GUIDE.md` as the source of truth for rules; this plan tracks **status and next targets**.

---

## Current architecture (Tune, completed pattern)

Tune remains orchestrated by **`src/ui/pages/tune.ts`** (imperative lifecycle: sweep, slider, `initTuneMode`, coordinator hooks). **Presentation** for major panels is React:

| Area | React component(s) | View-models / helpers | Mount host(s) in `Tune.tsx` |
| --- | --- | --- | --- |
| Optimal build window | `OptimalBuildWindow` | `tune-optimal-build-window-vm.ts` | `#optimal-content` |
| Build score (OBS) | `TuneObsBuildScore` | `tune-obs-build-score-vm.ts` | `#obs-content` |
| Hybrid dimension toggle | `TuneHybridDimToggle` | `tune-hybrid-dim-toggle-vm.ts` | `#tune-hybrid-toggle` |
| Delta vs baseline | `TuneDeltaVsBaseline` | `tune-delta-vs-baseline-vm.ts` | `#delta-content` |
| Gauge explorer | `TuneGaugeExplorer` | `tune-gauge-explorer-vm.ts` | `#gauge-explore-content` |
| Recommended builds | `TuneRecommendedBuilds` | `tune-recommended-builds-vm.ts` | `#recs-content` |
| What to try next | `TuneWttn` | `buildWhatToTryNextViewModel` in `recommendations.ts` | `#wttn-content` |
| Explore prompt | `TuneExplorePrompt` | `tune-explore-prompt-vm.ts` | `#explore-content` |
| Best value callout | `TuneBestValueCallout` | `tune-best-value-vm.ts` | `#slider-best-value` |
| Slider adornments | `TuneSliderAdornments` | `tune-slider-adornments-vm.ts` | `#tune-slider-adornments-root` |
| Sweep chart | `TuneSweepChart` | Chart config in `tune-sweep-chart.ts` | `#sweep-chart-root` |

**Integration rules in use:**

1. **`createRoot(container).render(...)`** from the owning `.ts` module — not a second React root for the whole app.
2. **`_ensureTuneReactRoot`** (or the same pattern elsewhere): when a lazy route unmounts, DOM nodes are recreated; roots must invalidate if `host !== container` or the host is disconnected, then `createRoot` again.
3. **Pure view-models** in `*-vm.ts` (or shared helpers); components under **`src/components/tune/`** are **props-only** (no Zustand in dumb leaves).
4. **Chart.js:** Tune sweep uses the global `Chart` from `index.html` inside `createTuneSweepChart`; the React shell `TuneSweepChart` owns canvas mount/unmount and registers the live chart handle back on `tune.ts` for `update('none')` on slider scrub.

---

## Overview workspace (completed)

Orchestrated by **`src/ui/pages/overview.ts`** with **`_ensureOverviewReactRoot`** (same invalidation semantics as Tune). **`renderDashboard`** remains the coordinator entry; **`radarTooltipHandler`** / chart helpers live in **`overview-radar-chart.ts`** and are re-exported from `overview.ts` for compatibility.

| Area | React component(s) | View-models / helpers | Mount host(s) in `Overview.tsx` |
| --- | --- | --- | --- |
| Hero + CTAs | `OverviewHero` | `overview-hero-vm.ts` | `#overview-hero` |
| Stat bars | `OverviewStatBars` | `overview-stat-bars-vm.ts` | `#stat-bars` |
| Build DNA highlights | `OverviewBuildDnaHighlights` | `overview-build-dna-vm.ts` | `#build-dna-highlights` |
| Radar chart | `OverviewRadarChart` | `overview-radar-chart.ts` (Chart.js + tooltip) | `#radar-chart-root` |
| OC foundation | `OverviewOCFoundation` | `overview-oc-foundation-vm.ts` | `#oc-foundation` |
| Fit profile card | `OverviewFitProfileCard` | `overview-fit-profile-vm.ts` | `#fit-grid` |
| Warnings | `OverviewWarnings` | `overview-warnings-vm.ts` | `#warnings-list` |

**Still imperative:** `renderOCSnapshot` (targets `#oc-snapshot`, not used on the main dashboard card), and **`renderFitProfile`** (single-line fit copy) if called from other modules. FMB wizard markup stays in `Overview.tsx` with logic in `find-my-build.ts`.

---

## Compendium workspace (partial)

Orchestrated by **`src/ui/pages/compendium.ts`**, **`src/ui/pages/strings.ts`**, and **`src/ui/pages/leaderboard.ts`** with **`_ensureCompendiumReactRoot`** / **`_ensureStringReactRoot`** (same invalidation semantics as Overview). **`cleanupCompendiumPage`**, **`cleanupStringsPage`**, and **`cleanupLeaderboardPage`** run from **`Compendium.tsx`** on unmount. **`comp-base-obs`** contract unchanged.

### Racket Bible (`compendium.ts`)

| Area | React component(s) | View-models / helpers | Mount host(s) |
| --- | --- | --- | --- |
| Hero + spec grid + pills | `CompendiumRacketHero` | `comp-racket-hero-vm.ts` | `#comp-react-hero-root` |
| Base frame profile (+ string-mod preview overlay) | `CompendiumBaseProfile` | `comp-base-profile-vm.ts` (`buildCompBaseProfileVm(frameBase, previewStats)`) | `#comp-react-base-profile-root` |
| Top builds | `CompendiumTopBuilds` | `comp-top-builds-vm.ts` | `#comp-react-top-builds-root` |
| HUD roster | `CompendiumFrameRoster` | (inline filters in `compendium.ts`) | `#comp-frame-list` |
| String modulator | `CompendiumStringModulator` | — | `#comp-react-string-modulator-root` |

**Still imperative:** `createSearchableSelect` on mains/crosses, **`_compInitStringInjector`**, base-profile preview via **`_compRenderBaseProfileReact`** (engine-driven), and **`data-comp-action`** delegation.

### Strings tab (`strings.ts`)

| Area | React component(s) | View-models / helpers | Mount host(s) |
| --- | --- | --- | --- |
| Detail (hero, telemetry, best frames, similar) | `StringCompendiumDetail` | `string-compendium-detail-vm.ts` | `#string-react-detail-root` |
| HUD list | `StringCompendiumRoster` | — | `#string-list` |
| Frame injection modulator | `StringFrameInjectionModulator` | — | `#string-react-frame-modulator-root` |

**Still imperative:** **`_stringInitModulator`**, SearchableSelects (with **`disposeSearchableSelectContainer`** before re-render), **`_stringRenderPreviewBars`** (updates preview segments under the modulator), tension/gauge **`change`** delegation. **`data-string-action`** delegation scoped to **`#mode-compendium`**.

### Leaderboard (`leaderboard.ts`)

Orchestrated by **`leaderboard.ts`** with **`_ensureLbResultsReactRoot`** (results) and **`_ensureLbShellReactRoot`** (filter shell). **`#comp-leaderboard-root`** wraps **`#lb2-shell-react-root`** (sticky controls + stats) and sibling **`#lb2-results`**. **`cleanupLeaderboardPage`** clears the root, **`_unmountLbShellReact`**, and **`_lbUnmountAllResultsReact`**.

| Area | React component(s) | View-models / helpers | Mount host(s) |
| --- | --- | --- | --- |
| Filter / stat shell | `LeaderboardShell` | `leaderboard-shell-vm.ts` | `#lb2-shell-react-root` |
| Builds table | `LeaderboardBuildResults` | `leaderboard-results-vm.ts` | `#lb2-build-results-react` (under `#lb2-results`) |
| Frames table | `LeaderboardFrameResults` | `leaderboard-results-vm.ts` | `#lb2-frame-results-react` |
| Strings table | `LeaderboardStringResults` | `leaderboard-results-vm.ts` | `#lb2-string-results-react` |

**Still imperative:** **`_runLbv2`** scheduling, **`count`** text on **`#lb2-count`**, and **`data-lb-action`** / **`data-lb-arg`** delegation on `document` (click + change for filter selects).

---

## What’s left (other workspaces)

Imperative modules still own most of: **Compare** (remaining slices if any), **Optimize**, **Find My Build**, **My Loadouts**, plus **shell** chrome that isn’t already in `src/components/shell/`. **Compendium** still has SearchableSelect wiring, **`_compInitStringInjector`** / **`_stringInitModulator`**, and the **HUD overlays** (`#comp-hud`, `#string-hud` in `Compendium.tsx`) — migrating the full HUD (search + filters + roster) is a **separate** slice; not started here.

**Do not** rewrite a full page in one PR. For each slice:

1. Snapshot legacy DOM + classes.
2. Extract a **pure** view-model function.
3. Add a **dumb** `.tsx` component under `src/components/<workspace>/` (or existing tree).
4. Mount with **`createRoot`** from the legacy file; delete only that slice’s imperative DOM.
5. Run **`npm run typecheck && npm run canary && npm run build && npm run test:runtime`**.

Suggested **non-binding** order (dependencies and churn vary):

1. **Compare** — panel rows that mirror the Tune pattern (VM + mount + bridge).
2. **Compendium** — optional React wrapper for SearchableSelect; modulator shells + leaderboard filter shell are React (`#comp-react-string-modulator-root`, `#string-react-frame-modulator-root`, `#lb2-shell-react-root`); result tables use `#lb2-build-results-react` / `#lb2-frame-results-react` / `#lb2-string-results-react`.
3. **Optimize / Find My Build** — as needed when touching those files.

The **shell** (`App.tsx`, `src/components/shell/`) is already React-first; extend it only when a feature truly belongs in the shell, not to bypass the widget rule.

---

## Coordinator and refresh plans

`src/runtime/coordinator.ts` **`RefreshPlan`** includes **`compendium`** (and overview / tune / compare flags). Any new workspace that syncs off `activeLoadout` or `mode` must:

- Extend **`getRefreshPlan`** only when a new surface needs coordinated refresh (avoid redundant work).
- Keep **`tests/runtime-hardening.test.ts`** in sync with the plan shape (see compendium test).

---

## Definition of done (per widget PR)

- [ ] Isolated migration: one widget or one clearly bounded cluster.
- [ ] JSX matches legacy structure and **Tailwind/class strings** unchanged unless byte-identical output.
- [ ] No new `window.*` globals for feature wiring.
- [ ] `npm run typecheck` — zero errors.
- [ ] `npm run canary` — pass (or `canary:baseline` documented if scoring touched).
- [ ] `npm run build` — success.
- [ ] `npm run test:runtime` — pass if refresh contracts or `getRefreshPlan` changed.

---

## References

| Doc | Role |
| --- | --- |
| [REACT-MIGRATION-GUIDE.md](./REACT-MIGRATION-GUIDE.md) | Zero-Pixel Protocol — mandatory process |
| [../README.md](../README.md) | Stack and repo layout |
| [../CLAUDE.md](../CLAUDE.md) | Commands and architecture for agents |
| [../ts-migration-plan.md](../ts-migration-plan.md) | TypeScript / bundler migration snapshot |

---

## Changelog

- **2026-04** — Initial post–Tune plan: Tune widget inventory, integration patterns, remaining workspaces, gates.
- **2026-04** — Overview dashboard migrated: `src/components/overview/*`, `overview-*-vm.ts`, `overview-radar-chart.ts`, `_ensureOverviewReactRoot`.
- **2026-04-01** — Compendium milestone: Racket Bible + Strings tab React islands (`src/components/compendium/*`, `src/components/strings/*`), VM modules, modulator HTML shells, `#comp-leaderboard-root` + `cleanupLeaderboardPage`, `Compendium.tsx` cleanup for comp/strings/leaderboard roots.
- **2026-04-01** — Compendium follow-up: base-profile **preview overlay** in React (`buildCompBaseProfileVm` + optional preview), `disposeSearchableSelectContainer` in `searchable-select.ts`, comp/string **delegation** gated on `#mode-compendium`.
- **2026-04-01** — Leaderboard v2 result tables: `LeaderboardBuildResults` / `LeaderboardFrameResults` / `LeaderboardStringResults`, `src/components/leaderboard/leaderboard-results-vm.ts`, hosts `#lb2-build-results-react`, `#lb2-frame-results-react`, `#lb2-string-results-react`, `_lbUnmountAllResultsReact` in `cleanupLeaderboardPage` and before loading spinners.
- **2026-04-01** — Compendium modulator shells + leaderboard filter shell: `CompendiumStringModulator` (`#comp-react-string-modulator-root`), `StringFrameInjectionModulator` (`#string-react-frame-modulator-root`), `LeaderboardShell` + `leaderboard-shell-vm.ts` (`#lb2-shell-react-root`); removed `comp-modulator-shell.ts` / `string-modulator-shell.ts` / imperative `_buildShellHTML`; HUD overlays remain in `Compendium.tsx` (deferred).
