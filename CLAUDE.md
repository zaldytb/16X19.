# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Tennis Loadout Lab ("16X19") is a physics-based tennis equipment prediction engine. Users select racquets, strings, and tensions to get performance predictions across 11 attributes. It's a static SPA (Vite + TypeScript + Tailwind) deployed to GitHub Pages (primary) and Vercel (mirror).

---

## Commands

```bash
# Development
npm run dev          # Start Vite dev server
npm run build        # Production build → dist/
npm run preview      # Preview production build

# Validation (run before every commit)
npm run typecheck    # TypeScript check — must be zero errors
npm run canary       # 5 regression tests — must pass with zero OBS drift

# Data pipeline (when modifying pipeline/data/*.json)
npm run pipeline     # validate + export:verify (validate, regenerate generated app data + data.ts, run canaries)
npm run validate     # Validate frames.json / strings.json against schemas
npm run export       # Regenerate src/data/generated.ts and data.ts from JSON source files
npm run canary:baseline  # Re-record expected canary values (after intentional engine changes)

# Data ingestion
npm run ingest:frame    # Interactive frame (racquet) ingestion
npm run ingest:string   # Interactive string ingestion
npm run estimate        # String scoring accuracy stats
npm run calibrate       # Re-fit string estimation coefficients
```

**Pre-commit checklist:** `npm run typecheck && npm run canary && npm run build`

---

## Architecture

### Startup and module wiring

TypeScript owns all live UI and engine code under `src/`. [`src/main.tsx`](src/main.tsx) is the Vite entry — it mounts the React app and initializes startup helpers such as the favicon heartbeat. [`src/App.tsx`](src/App.tsx) mounts the shell and calls [`src/bridge/installWindowBridge.ts`](src/bridge/installWindowBridge.ts) for the Digicraft boot sequence plus vanilla shell/bootstrap wiring. There is no root `app.js` monolith.

Cross-module behavior now prefers direct imports, delegated listeners, or explicit callback registries. Do not add new `window.*` globals as part of normal feature work.

React Router routes live in `src/App.tsx`, with route wrappers in `src/pages/` and shell UI in `src/components/shell/`. Most imperative workspace behavior still lives in `src/ui/pages/`.

### Runtime coordination (`src/runtime/`)

`src/runtime/coordinator.ts` is the refresh coordinator for route changes and shared state changes. It computes refresh plans and calls callback registries such as `src/ui/pages/overview-runtime-bridge.ts`, `src/ui/pages/tune-runtime-bridge.ts`, and `src/ui/pages/compare-runtime-bridge.ts`.

Treat those `*-runtime-bridge.ts` files as internal callback registries for lazy page modules, not as a revival of the old `window.*` bridge.

### 4-Layer Prediction Engine (`src/engine/`)

Pure TypeScript functions — deterministic, no side effects. Same inputs always produce identical outputs.

| Layer | File | What it does |
| ----- | ---- | ----------- |
| L0 | `frame-physics.ts` | `calcFrameBase()` — normalize raw racquet specs → 11 base attribute scores via weighted linear models |
| L1 | `string-profile.ts` | `calcBaseStringProfile()` + `calcStringFrameMod()` — string scoring + frame-coupling deltas |
| L2 | `tension.ts` | `calcTensionModifier()` — pattern-aware tension effects (open/dense/standard patterns) |
| L3 | `hybrid.ts` | `calcHybridInteraction()` — mains/crosses material pairing bonuses |
| Final | `composite.ts` | `predictSetup()` — combines all layers into composite OBS score, maps to 10-tier ranking |

All domain types are in `src/engine/types.ts`. Constants (gauge options, OBS tiers, stat keys) are in `src/engine/constants.ts`.

### State management (`src/state/`)

Centralized single-source-of-truth store:

- `useAppStore.ts` — backing Zustand store for loadout + app state
- `store.ts` — active/saved loadout facade used by runtime and non-React code
- `loadout.ts` — CRUD operations, localStorage persistence
- `setup-sync.ts` — `getCurrentSetup()`, cross-page state synchronization
- `app-state.ts` — mode, compare slots, radar/slot colors, dock editor context facade
- `presets.ts` — top builds generation

All pages derive their initial state from `getCurrentSetup()`. The active loadout is the canonical source. Prefer the `store.ts` / `app-state.ts` facades for runtime code; use Zustand hooks/selectors only where React ownership is helpful.

### Data layer

- `pipeline/data/frames.json` — racquet database (source of truth, never edit generated outputs directly)
- `pipeline/data/strings.json` — string database (source of truth)
- `src/data/generated.ts` — **generated app data module** from `npm run export`; commit after regenerating
- `data.ts` — **generated compatibility module** from `npm run export`; commit after regenerating
- `pipeline/schemas/` — JSON schemas used by `npm run validate`
- `src/data/loader.ts` — imports `RACQUETS`, `STRINGS`, `FRAME_META` from `src/data/generated.ts`

### UI pages (`src/ui/pages/`)

Imperative page modules include `shell.ts`, `overview.ts`, `tune.ts`, `compare/`, `optimize.ts`, `compendium.ts`, `strings.ts`, `find-my-build.ts`, `my-loadouts.ts`, and `leaderboard.ts`. React route wrappers live separately under `src/pages/`.

The live Find My Build flow is the imperative `find-my-build.ts` module opened from Overview and dock actions, not a standalone routed workspace.

---

## Critical rules

- **Never edit `src/data/generated.ts` or `data.ts` directly** — both are generated. Modify `pipeline/data/frames.json` or `pipeline/data/strings.json`, then run `npm run pipeline`.
- **Swingweight spelling** — field name in JSON data is `swingweight` (lowercase 'w'), not `swingWeight`.
- **TypeScript strict mode** — `src/` (engine, state, UI) must pass `npm run typecheck` with zero errors.
- **Canary tests have zero drift tolerance** — any OBS score change (even 0.1) will fail. If you intentionally change engine math, run `npm run canary:baseline` to re-record.
- **Tailwind setup is mixed on purpose** — the app uses `@tailwindcss/vite`, and `index.html` still carries inline Tailwind config/runtime tokens. Treat both as load-bearing unless you are doing a dedicated styling audit.

---

## Design system

"Digicraft Brutalism" — monochrome + orange accent. Custom CSS in `style.css` (~5,400 lines).

Key tokens: `dc-void` (#1A1A1A), `dc-accent` (#FF4500), `dc-platinum` (#DCDFE2). Dark mode via `data-theme="dark"` on `<html>`. Fonts: Inter (sans) + JetBrains Mono.

---

## Deployment

Auto-deploys to GitHub Pages on push to `main` via `.github/workflows/deploy.yml`. Vercel also deploys on every push. No manual deployment steps needed beyond pushing.

---

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
 needed. Always curl <https://ai-gateway.vercel.sh/v1/models> first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
