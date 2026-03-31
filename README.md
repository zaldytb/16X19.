# 16X19 / Tennis Loadout Lab

Frame × String × Tension prediction for tennis setups.

16X19 models how a racquet and string setup performs across 11 attributes:
power, spin, control, comfort, feel, stability, forgiveness, launch,
maneuverability, durability, and playability.

The app lets users:

- browse a racquet database
- browse a string database
- build full-bed and hybrid setups
- view performance predictions and OBS composite scores
- tune tension with live deltas
- compare multiple setups side by side
- generate optimized and recommended builds
- save, restore, and share loadouts
- persist the current active loadout and saved loadouts across refreshes via local storage

Primary URL: `https://github.com/zaldytb/16X19.`  
Mirror: `https://16x19.vercel.app/`

## Stack

- **Vite 8** — dev server and production bundle
- **TypeScript 6** — strict mode for `src/` (engine, state, UI)
- **Tailwind CSS 4** — `@tailwindcss/vite` for the app build, with inline runtime config/tokens still declared in `index.html`; design tokens and component styles live in `style.css`
- **Chart.js** — npm dependency used by overview, compare, and tune charts
- **Node.js 20+** — data pipeline and tooling (`tsx` for TypeScript scripts)

There is **no** root `app.js` monolith. The Vite entry is [`src/main.tsx`](src/main.tsx) (React + React Router). [`src/App.tsx`](src/App.tsx) mounts the shell and calls [`src/bridge/installWindowBridge.ts`](src/bridge/installWindowBridge.ts) for boot animation and vanilla shell/bootstrap wiring. Cross-module UI behavior now uses direct imports, delegated listeners, and callback registries rather than a `window.*` bridge.

## Quick start

```bash
npm install
npm run dev
npm run typecheck
npm run canary
npm run build
```

## Architecture (summary)

| Layer | Location | Role |
| -------- | ----------- | ------ |
| Engine | `src/engine/` | Deterministic prediction (L0–L3 + composite) |
| State | `src/state/` | Zustand-backed loadout and app state, plus stable facades for runtime code |
| React shell | `src/App.tsx`, `src/pages/`, `src/components/` | Routes, shell layout, workspace wrappers, header/dock/footer |
| Runtime | `src/runtime/`, `src/ui/pages/*-runtime-bridge.ts` | Coordinator-driven refresh plans and cross-page callback registries |
| UI | `src/ui/` | Imperative workspace modules, dock renderers, shared UI helpers |
| Bootstrap | `src/bridge/installWindowBridge.ts` | Boot animation helpers and vanilla shell/bootstrap wiring |
| Data | `pipeline/data/*.json` → `npm run export` → `src/data/generated.ts` + `data.ts` | Source of truth plus generated TypeScript data modules |

See [AGENTS.md](AGENTS.md) for agent-oriented detail and debugging notes.

## Repository layout

```text
16X19/
├── index.html
├── vite.config.ts
├── style.css
├── data.ts                 # generated compatibility module — do not edit
├── src/
│   ├── main.tsx            # Vite entry (React root)
│   ├── App.tsx             # React shell, routing, and startup wiring
│   ├── bridge/             # boot sequence + vanilla shell/bootstrap helpers
│   ├── components/         # React shell components (header, dock, footer, mobile tabs)
│   ├── context/            # React providers (theme, etc.)
│   ├── global.d.ts         # reserved for shared global typing (currently minimal)
│   ├── hooks/              # React-facing selectors/hooks over shared app state
│   ├── pages/              # route wrappers/workspaces used by React Router
│   ├── routing/            # path ↔ mode helpers and router integration
│   ├── runtime/            # view coordinator, contracts, diagnostics, refresh bridges
│   ├── vite-env.d.ts
│   ├── engine/
│   ├── state/
│   ├── ui/
│   │   ├── pages/          # imperative page logic (overview, tune, compare, compendium, …)
│   │   ├── components/
│   │   └── shared/
│   ├── data/
│   └── utils/
├── pipeline/
│   ├── data/
│   ├── schemas/
│   ├── scripts/*.ts        # validate, export, canary, ingest, … (run with tsx)
│   └── engine/             # pipeline-only/reference engine utilities
├── docs/                   # in-repo wiki-style guides
├── tools/                  # frame-gui, helpers
└── .github/workflows/
```

## Prediction engine

The engine is deterministic: identical inputs always yield identical outputs.

Pipeline stages:

- **L0:** frame physics normalization
- **L0.5:** frame contradiction modeling from `_meta`, `_novelty`, and generated rarity profile
- **L1:** string profile and frame coupling
- **L2:** tension effects
- **L3:** hybrid interaction

Outputs include 11 attribute scores, build identity / archetype, and an OBS composite score that reflects frame-led contradictions through the attribute model itself, plus tension sanity penalties.

## State model

The **active loadout** is the source of truth for the live app.

- `src/state/useAppStore.ts` — backing Zustand store for loadout + app state
- `src/state/store.ts` — stable active/saved loadout facade for runtime and non-React code
- `src/state/loadout.ts` — saved-loadout CRUD plus localStorage persistence for saved lists
- `src/state/active-loadout-storage.ts` — active-loadout localStorage persistence and boot restore helpers
- `src/state/setup-sync.ts` — racquet/string setup derived from the active loadout
- `src/state/app-state.ts` — stable facade for mode, compare slots, charts, and dock editor context

At startup, `src/ui/pages/shell.ts` hydrates saved loadouts first, then restores the active loadout from local storage so dock, overview, tune, and compare flows survive a hard refresh.

Most non-React modules should still depend on `store.ts` / `app-state.ts`; React components can use the hooks/selectors layered over `useAppStore.ts`.

## Data pipeline

**Source of truth (edit these):**

- `pipeline/data/frames.json`
- `pipeline/data/strings.json`
- `pipeline/data/canaries.json`

**Generated (never hand-edit):**

- `src/data/generated.ts` — produced by `npm run export` / `npm run pipeline`, used by the app (`RACQUETS`, `STRINGS`, `FRAME_META`, `FRAME_NOVELTY_PROFILE`)
- `data.ts` — root compatibility re-export produced by `npm run export` / `npm run pipeline`

For frames, authoring now splits into two internal modeling blocks:

- `_meta` for construction / technology tendencies
- `_novelty` for reviewer-authored contradiction hints that are applied at the frame stage before string blending

```bash
npm run validate          # schema validation
npm run export            # JSON → src/data/generated.ts + data.ts
npm run export:verify     # export + canary
npm run pipeline          # validate + export:verify
npm run ingest:frame
npm run ingest:string
npm run scrape:twu
npm run scrape:twu-strings
```

Pipeline scripts are **TypeScript** (`.ts`) and run with **`tsx`** (see `package.json`).

## Testing and release checks

Before pushing:

```bash
npm run typecheck && npm run canary && npm run build
```

Manual smoke (after UI or engine changes): overview hero/radar, tune apply flow, compare slots/editor, compendium/strings, dock save/activate, leaderboard tab roundtrip, and refresh persistence for both active and saved loadouts.

## Deployment

GitHub Pages builds from `main` (see `.github/workflows/`).

```bash
git push origin main
```

Actions: `https://github.com/zaldytb/loadout-lab/actions`  
Vercel mirror: `https://loadout-lab.vercel.app`

## Further reading

- [AGENTS.md](AGENTS.md) — conventions for contributors and coding agents  
- [docs/README.md](docs/README.md) — documentation index (“wiki”)  
- [docs/Getting-Started.md](docs/Getting-Started.md) — setup, ingest, pipeline  
- [ts-migration-plan.md](ts-migration-plan.md) — migration status and follow-ups  
- [CLAUDE.md](CLAUDE.md) — Claude Code project notes  
