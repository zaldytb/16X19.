# 16X19 / Tennis Loadout Lab

Frame x String x Tension prediction for tennis setups.

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

Primary URL: `https://github.com/zaldytb/16X19`  
Mirror: `https://16x19.vercel.app/`

## Stack

- **Vite 8** - dev server and production bundle
- **TypeScript 6** - strict mode for `src/` (engine, state, UI)
- **React 19** - shell, route wrappers, and migrated UI islands
- **Zustand 5** - app and loadout state store
- **Tailwind CSS 4** - `@tailwindcss/vite` for the app build, with inline runtime config/tokens still declared in `index.html`; design tokens and component styles live in `style.css`
- **Chart.js** - `chart.js` npm package loaded **on demand** via `import('chart.js')` from [`src/chart/ensure-chart-loaded.ts`](src/chart/ensure-chart-loaded.ts) (Overview radar, Tune sweep, Compare radar). No Chart.js CDN script in `index.html`.
- **Node.js 20+** - data pipeline and tooling (`tsx` for TypeScript scripts)

There is **no** root `app.js` monolith. The Vite entry is [`src/main.tsx`](src/main.tsx): it loads the equipment catalog (`initCatalog()` → `fetch` of `public/data/catalog.json`), then dynamically imports [`src/App.tsx`](src/App.tsx) so the main bundle does not ship the full app graph before the catalog resolves. [`App.tsx`](src/App.tsx) mounts the shell and calls [`src/bridge/installWindowBridge.ts`](src/bridge/installWindowBridge.ts) for boot animation and vanilla shell/bootstrap wiring. Cross-module UI behavior uses direct imports, delegated listeners, and callback registries rather than a `window.*` bridge.

Where imperative code must run immediately after a micro-React tree commits, owning modules use `flushSync` around `createRoot().render()` so `getElementById` targets exist before init. That pattern is used in Tune and Compendium/Strings.

## Quick start

```bash
npm install
npm run dev
npm run typecheck
npm run canary
npm run build
```

## Architecture

| Layer | Location | Role |
| --- | --- | --- |
| Engine | `src/engine/` | Deterministic prediction and OBS scoring |
| State | `src/state/` | Zustand store (`useAppStore.ts`) as SSOT; `imperative.ts` for vanilla/runtime accessors; `selectors.ts` + `setup-from-loadout.ts` for derived setup |
| React shell | `src/App.tsx`, `src/pages/`, `src/components/shell/` | Routes, shell layout, header/dock/footer, workspace wrappers |
| React workspace widgets | `src/components/tune/`, `overview/`, `compare/`, `compendium/`, `strings/`, `leaderboard/`, `optimize/`, `shell/` | Strangler Fig islands mounted from owning `src/ui/pages/*.ts` modules via `createRoot` + `_ensure*ReactRoot`; pure view-models in `*-vm.ts` |
| Runtime | `src/runtime/`, `src/ui/pages/*-runtime-bridge.ts` | Coordinator-driven refresh plans and cross-page callback registries |
| UI orchestration | `src/ui/` | Imperative workspace orchestration (`tune.ts`, `overview.ts`, `compare/`, `optimize.ts`, `compendium.ts`, ...) plus dock/shared helpers |
| Bootstrap | `src/bridge/installWindowBridge.ts` | Boot animation helpers and vanilla shell/bootstrap wiring |
| Bundle / charts | `src/chart/ensure-chart-loaded.ts` | Single dynamic `import('chart.js')` for radar and line charts; registers once and sets `globalThis.Chart` for `Chart.getChart` |
| Data | `pipeline/data/*.json` → `npm run export` → `src/data/generated.ts` + `data.ts` + `public/data/catalog.json` | Source JSON + generated TS modules; **runtime** reads [`src/data/loader.ts`](src/data/loader.ts) which `fetch`es `catalog.json` at boot and fills mutable `RACQUETS` / `STRINGS` / meta maps (keeps the catalog out of the JS parse path) |

**Lazy routes** ([`src/pages/Workspaces.tsx`](src/pages/Workspaces.tsx)): `React.lazy()` for Tune, Compare, Optimize, Compendium (includes `/strings` and `/leaderboard` tabs), and How It Works; Overview stays eager. [`src/App.tsx`](src/App.tsx) wraps the routed `Outlet` in `<Suspense>`.

Current React migration status:

- Tune: major panels are React islands
- Overview: dashboard surfaces are React islands
- Compare: core panels are React islands
- Compendium / Strings / Leaderboard: main surfaces are React islands
- My Loadouts: dock list is a React island
- Find My Build: results summary/directions are React islands; wizard flow remains imperative
- Optimize: results table/loading/empty state are React; filters and run loop remain imperative

See [AGENTS.md](AGENTS.md) for agent-oriented detail and debugging notes.

## Repository layout

```text
16X19/
├── index.html
├── vite.config.ts
├── style.css
├── data.ts                 # generated compatibility module - do not edit
├── public/
│   └── data/
│       └── catalog.json    # generated by npm run export; runtime catalog fetch
├── src/
│   ├── main.tsx            # Vite entry: initCatalog + dynamic App import
│   ├── App.tsx             # React shell, routing, startup wiring
│   ├── chart/              # Chart.js dynamic loader (ensure-chart-loaded)
│   ├── bridge/             # boot sequence + vanilla shell/bootstrap helpers
│   ├── components/         # shell + migrated workspace widgets
│   ├── context/            # React providers
│   ├── hooks/              # React-facing selectors/hooks over shared app state
│   ├── pages/              # route wrappers/workspaces used by React Router
│   ├── routing/            # path <-> mode helpers and router integration
│   ├── runtime/            # coordinator, contracts, diagnostics, bridges
│   ├── engine/
│   ├── state/
│   ├── ui/
│   │   ├── pages/          # imperative page logic and view-model builders
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

The **active loadout** is the source of truth for the live app. **Zustand** (`useAppStore`) holds loadout + app state; setting the active loadout persists via `active-loadout-storage` inside the store action.

- `src/state/useAppStore.ts` - Zustand store (single source of truth for loadout + app fields)
- `src/state/imperative.ts` - synchronous getters/setters and keyed `subscribe` for vanilla TS, runtime, and shell (wraps `useAppStore.getState()`)
- `src/state/selectors.ts` - pure selectors over store state (e.g. `selectCurrentSetup`)
- `src/state/setup-from-loadout.ts` - pure `getSetupFromLoadout` / racquet-string resolution with caching
- `src/state/setup-sync.ts` - `getCurrentSetup()` and compendium sync helpers (derive from store + selectors)
- `src/state/loadout.ts` - saved-loadout CRUD plus localStorage persistence for saved lists
- `src/state/active-loadout-storage.ts` - active-loadout localStorage serialization used by the store
- `src/hooks/useStore.ts` - React hooks wrapping `useAppStore` selectors (e.g. `useCurrentSetup`)

At startup, `src/ui/pages/shell.ts` hydrates saved loadouts first, then restores the active loadout from local storage so dock, overview, tune, compare, and optimizer flows survive a hard refresh.

## Data pipeline

**Source of truth (edit these):**

- `pipeline/data/frames.json`
- `pipeline/data/strings.json`
- `pipeline/data/canaries.json`

**Generated (never hand-edit):**

- `src/data/generated.ts` — produced by `npm run export` / `npm run pipeline` (same catalog payload as `catalog.json`; keep in sync for tooling and type-checking)
- `data.ts` — root compatibility re-export produced by `npm run export` / `npm run pipeline`
- `public/data/catalog.json` — produced by `npm run export`; **loaded at runtime** by [`src/data/loader.ts`](src/data/loader.ts) (`initCatalog()`) so the live app does not parse large inlined arrays from the main bundle

After a fresh clone or data change, run `npm run export` (or `npm run pipeline`) so `catalog.json` exists before `npm run dev` / production builds.

For frames, authoring splits into two internal modeling blocks:

- `_meta` for construction / technology tendencies
- `_novelty` for reviewer-authored contradiction hints applied at the frame stage before string blending

```bash
npm run validate          # schema validation
npm run export            # JSON → src/data/generated.ts + data.ts + public/data/catalog.json
npm run export:verify     # export + canary
npm run pipeline          # validate + export:verify
npm run ingest:frame
npm run ingest:string
npm run scrape:twu
npm run scrape:twu-strings
```

Pipeline scripts are TypeScript and run with `tsx`.

## Testing and release checks

Before pushing:

```bash
npm run typecheck && npm run canary && npm run build && npm run test:runtime
```

Manual smoke after UI or engine changes: overview hero/radar, Find My Build results, tune apply flow, compare slots/editor, optimizer results/actions, compendium/strings, dock save/activate/delete-confirm, leaderboard tab roundtrip, and refresh persistence for both active and saved loadouts.

## Deployment

GitHub Pages builds from `main`.

```bash
git push origin main
```

Actions: `https://github.com/zaldytb/16X19/actions`  
Vercel mirror: `https://16x19.vercel.app/`

## Further reading

- [AGENTS.md](AGENTS.md) - conventions for contributors and coding agents
- [docs/README.md](docs/README.md) - documentation index
- [docs/Getting-Started.md](docs/Getting-Started.md) - setup, ingest, pipeline
- [ts-migration-plan.md](ts-migration-plan.md) - TypeScript / bundler migration snapshot
- [docs/REACT-MIGRATION-GUIDE.md](docs/REACT-MIGRATION-GUIDE.md) - Zero-Pixel Protocol for React migration
- [docs/REACT-MIGRATION-PLAN.md](docs/REACT-MIGRATION-PLAN.md) - React migration status and next targets
- [CLAUDE.md](CLAUDE.md) - Claude Code project notes
