# Tennis Loadout Lab — Agent documentation

## Project overview

16X19 (Tennis Loadout Lab) is a physics-based tennis equipment analysis tool. It predicts how a racquet and string setup performs across 11 attributes and summarizes the build with an OBS composite score plus identity/archetype output. Frame-level contradiction modeling is applied before the string layer rather than being surfaced as a separate user-facing novelty score.

**Primary URL:** `https://zaldytb.github.io/loadout-lab/`  
**Mirror:** `https://loadout-lab.vercel.app`

**README / repo aliases:** The root [README.md](README.md) intentionally uses the **`16X19`** GitHub repo path (`github.com/zaldytb/16X19`) and **`16x19.vercel.app`** as the mirror. Those are equivalent entry points for the same app; **do not** replace them with `loadout-lab` URLs when editing README unless the user explicitly asks.

### Core workflows

- Browse racquets (Racket Bible) and strings (String Compendium)
- Configure full-bed and hybrid builds
- Tune tension with live feedback
- Compare up to three setups
- Optimize and explore recommended builds
- Save, activate, duplicate, and share loadouts

## Technology stack

| Category | Technology |
| ---------- | ------------ |
| Build | Vite 8.x |
| App language | TypeScript 6.x (strict) under `src/` |
| Styling | Tailwind CSS 4.x via `@tailwindcss/vite`, with inline `index.html` config still present, plus `style.css` design tokens |
| Package manager | npm |
| Runtime | Node.js 20+ (pipeline via `tsx`) |
| Charts | Chart.js (`chart.js` where imported; global `Chart` in `index.html` for Tune sweep) |
| Deploy | GitHub Pages + Vercel |

**Important:** Tailwind is wired through `@tailwindcss/vite`, and `index.html` still carries inline runtime config. Runtime-generated utility strings in TypeScript should stay verbatim to avoid styling drift.

## Runtime architecture

### 1. Vite entry and bootstrap flow

[`src/main.tsx`](src/main.tsx) is the only application entry. It:

- mounts the React app and router
- initializes shared startup helpers such as the favicon heartbeat

[`src/App.tsx`](src/App.tsx) mounts the shell and calls [`src/bridge/installWindowBridge.ts`](src/bridge/installWindowBridge.ts) for the Digicraft boot sequence plus vanilla shell/bootstrap wiring.

React Router routes live in [`src/App.tsx`](src/App.tsx), with workspace wrappers in [`src/pages/`](src/pages/) and shell UI in [`src/components/shell/`](src/components/shell/). Lazy routes such as Tune, Compare, and Optimize are owned by [`src/pages/Workspaces.tsx`](src/pages/Workspaces.tsx).

[`src/global.d.ts`](src/global.d.ts) is effectively empty now; strict TypeScript no longer relies on a large `Window` augmentation layer.

When debugging startup issues, trace `runVanillaAppInit()` and the boot helpers in [`src/bridge/installWindowBridge.ts`](src/bridge/installWindowBridge.ts). Cross-module UI actions now flow through direct imports, delegated listeners, and callback registries instead of a `window.*` bridge.

### 2. No root `app.js`

The historical `app.js` monolith is **removed**. Live page logic now spans `src/**/*.ts` and `src/**/*.tsx`.

### 3. Runtime view coordination

[`src/runtime/coordinator.ts`](src/runtime/coordinator.ts) is the cross-page refresh coordinator. It computes refresh plans from route + store changes (including a **`compendium`** flag when that shell mode needs loadout sync) and fans out through callback registries such as:

- [`src/ui/pages/overview-runtime-bridge.ts`](src/ui/pages/overview-runtime-bridge.ts)
- [`src/ui/pages/tune-runtime-bridge.ts`](src/ui/pages/tune-runtime-bridge.ts)
- [`src/ui/pages/compare-runtime-bridge.ts`](src/ui/pages/compare-runtime-bridge.ts)

Those files are internal callback registries used to keep lazy page modules decoupled from the main shell graph.

### 4. Active loadout is source of truth

- `src/state/store.ts` — active and saved loadouts  
- `src/state/active-loadout-storage.ts` — active-loadout localStorage persistence and restore helpers  
- `src/state/setup-sync.ts` — current racquet/string setup from the active loadout  

The active loadout and saved loadouts are expected to survive a hard refresh. Boot restore happens from `src/ui/pages/shell.ts` during `Shell.init()`.

### 5. Shared UI state

[`src/state/useAppStore.ts`](src/state/useAppStore.ts) is the backing Zustand store. [`src/state/store.ts`](src/state/store.ts) and [`src/state/app-state.ts`](src/state/app-state.ts) are the stable facades most runtime code should import from. Prefer these over new ad hoc globals.

## Project structure

```text
loadout-lab/
├── index.html
├── vite.config.ts
├── style.css
├── data.ts
├── README.md
├── AGENTS.md
├── CLAUDE.md
├── ts-migration-plan.md
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── shell/
│   │   ├── tune/               # Tune workspace widgets (mounted from ui/pages/tune.ts)
│   │   └── overview/           # Overview dashboard widgets (mounted from ui/pages/overview.ts)
│   ├── context/
│   ├── global.d.ts
│   ├── hooks/
│   ├── pages/
│   │   ├── Workspaces.tsx
│   │   ├── Overview.tsx
│   │   ├── Tune.tsx
│   │   ├── Compare.tsx
│   │   └── …
│   ├── routing/
│   ├── runtime/
│   │   ├── coordinator.ts
│   │   ├── contracts.ts
│   │   └── diagnostics.ts
│   ├── vite-env.d.ts
│   ├── engine/
│   ├── state/
│   │   ├── useAppStore.ts
│   │   ├── store.ts
│   │   ├── loadout.ts
│   │   ├── setup-sync.ts
│   │   ├── app-state.ts
│   │   └── presets.ts
│   ├── ui/
│   │   ├── pages/              # imperative page modules + runtime callback registries
│   │   ├── components/
│   │   └── shared/
│   ├── data/
│   └── utils/
├── pipeline/
├── docs/
└── .github/workflows/
```

## Commands

### Development

```bash
npm run dev
npm run typecheck
```

### Production

```bash
npm run build
npm run preview
```

### Data and regression

```bash
npm run validate
npm run export
npm run export:verify
npm run canary
npm run canary:baseline
npm run pipeline
```

### Ingestion and TWU tooling

```bash
npm run ingest:frame
npm run ingest:string
npm run scrape:twu
npm run scrape:twu-strings
npm run enrich:twu
npm run estimate
npm run calibrate
```

Pipeline scripts live in `pipeline/scripts/*.ts` and run with **`tsx`**.

## Data pipeline

**Source of truth:** `pipeline/data/frames.json`, `strings.json`, `canaries.json`  
**Generated:** `src/data/generated.ts` and root compatibility `data.ts` — never hand-edit; regenerate with `npm run export` or `npm run pipeline`. Generated data now includes `FRAME_META` and `FRAME_NOVELTY_PROFILE` alongside `RACQUETS` / `STRINGS`.

For frame ingestion/modeling:

- `_meta` carries construction / technology tendencies (`aeroBonus`, `comfortTech`, `spinTech`, `genBonus`)
- `_novelty` carries reviewer-authored contradiction hints (`controlBomber`, `plushLauncher`, `stableWhipper`, `preciseSpinner`, `comfortableAttacker`)
- frame contradiction modeling is applied after frame base calculation and before the string layer, so users infer it through the final stat shape rather than a separate novelty UI

## Debugging notes

### Routing / mode sync

Route changes flow through [`src/App.tsx`](src/App.tsx) and [`src/routing/modePaths.ts`](src/routing/modePaths.ts). `pathToMode()` intentionally aliases some secondary routes like `/strings` and `/leaderboard` back to the Compendium shell mode so shared nav state stays coherent.

### Tune

Sensitive to split state paths. When changing Tune, verify together: delta card, OBS in Tune, WTTN, recommendations, loadout switching while Tune is open, slider → apply.

Because Tune may mutate the active loadout directly before re-rendering, also verify refresh persistence after applying tension or gauge changes.

### Compare

Compare runtime is TypeScript (`src/ui/pages/compare/`). Keep dock actions and `app-state` compare slots in sync with the compare module.

### Overview

Overview is TS-owned (`overview.ts`). If the UI looks empty or duplicated, check for a second render pass or stale listeners, not a legacy `app.js` path.

### Find My Build

The live wizard is the imperative module [`src/ui/pages/find-my-build.ts`](src/ui/pages/find-my-build.ts), opened from Overview and dock actions. There is no standalone routed Find My Build workspace in the current shell.

## Testing strategy

**Automated gate (required before commit):**

```bash
npm run typecheck && npm run canary && npm run build && npm run test:runtime
```

**Manual smoke** after UI or engine work: overview hero/bars/radar/fit/warnings; tune; compare; compendium/strings; dock create/save/activate; leaderboard tab.

If you touched state, boot, dock, or tune/compare flows, also refresh the page and confirm:

- the active loadout restores correctly
- saved loadouts still render in the dock
- compare can still seed from the restored active loadout

## Common pitfalls

1. `src/data/generated.ts` and `data.ts` are generated — edit JSON under `pipeline/data/` and re-run the pipeline.  
2. Tailwind utilities in TS templates should stay stable — avoid risky dynamic class composition when touching runtime-generated markup.  
3. Dark mode: `data-theme="dark"` on `<html>`.  
4. JSON field name: **`swingweight`** (lowercase `w`).  
5. Import paths in TS often end in `.js` (bundler resolution to `.ts` sources).  
6. Stale client state can produce a “working” UI with wrong numbers — verify store + setup-sync when scores look off.
7. Active-loadout persistence is separate from saved-loadout persistence — check both paths when debugging refresh regressions.

## Deployment

Push to `main` for GitHub Pages; Vercel mirrors the repo.

```bash
git push origin main
```

Actions: `https://github.com/zaldytb/16X19/actions`

## Further reference

- [ts-migration-plan.md](ts-migration-plan.md) — TypeScript / bundler snapshot and React migration pointer  
- [docs/REACT-MIGRATION-GUIDE.md](docs/REACT-MIGRATION-GUIDE.md) — Zero-Pixel Protocol for React UI migration  
- [docs/REACT-MIGRATION-PLAN.md](docs/REACT-MIGRATION-PLAN.md) — post–Tune React roadmap  
- [docs/README.md](docs/README.md) — documentation index  
- [CLAUDE.md](CLAUDE.md) — Claude Code checklist and commands  
