# Tennis Loadout Lab (16X19) — Agent Documentation

## Project Overview

**Tennis Loadout Lab** (internally "16X19") is a physics-based tennis equipment analysis tool that predicts how a racquet and string setup performs across 11 attributes: power, spin, control, comfort, feel, stability, forgiveness, launch, maneuverability, durability, and playability.

**Primary URL:** `https://zaldytb.github.io/loadout-lab/`  
**Mirror:** `https://loadout-lab.vercel.app`  
**Repository:** `https://github.com/zaldytb/16X19`

### Core Features

- Browse racquets (Racket Bible) and strings (String Compendium)
- Configure full-bed and hybrid string setups
- Tune tension with live feedback and delta calculations
- Compare up to three setups side-by-side
- Optimize and explore recommended builds
- Save, activate, duplicate, and share loadouts
- Persist active loadout and saved loadouts across refreshes via localStorage

---

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Build Tool | Vite | 8.x |
| Language | TypeScript | 6.x (strict mode) |
| UI Framework | React | 19.x |
| State Management | Zustand | 5.x |
| Styling | Tailwind CSS | 4.x via `@tailwindcss/vite` |
| Charts | Chart.js | 4.x (dynamic import) |
| Routing | React Router | 7.x |
| Runtime | Node.js | 20+ |
| Script Runner | tsx | 4.x |

**Design System:** "Digicraft Brutalism" — monochrome + orange accent (`#FF4500`)

Key tokens:
- `dc-void` (#1A1A1A) — primary background
- `dc-accent` (#FF4500) — accent color
- `dc-platinum` (#DCDFE2) — text color
- Fonts: Inter (sans) + JetBrains Mono

Dark mode via `data-theme="dark"` on `<html>` element.

---

## Project Structure

```
16X19/
├── index.html                    # Entry HTML with Tailwind CDN config
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration (strict mode)
├── package.json                  # npm scripts and dependencies
├── style.css                     # Design tokens and component styles (~8,600 lines)
├── data.ts                       # Generated compatibility module (DO NOT EDIT)
├── AGENTS.md                     # This file
├── CLAUDE.md                     # Claude Code specific guidance
├── README.md                     # Human-readable project overview
│
├── public/
│   └── data/
│       └── catalog.json          # Generated runtime catalog (fetched at boot)
│
├── src/
│   ├── main.tsx                  # Vite entry point (bootstraps catalog, mounts React)
│   ├── App.tsx                   # React shell with routing
│   ├── global.d.ts               # Global type declarations
│   ├── vite-env.d.ts             # Vite environment types
│   │
│   ├── bridge/                   # Boot sequence + vanilla helpers
│   │   └── installWindowBridge.ts
│   │
│   ├── chart/                    # Chart.js dynamic loader
│   │   └── ensure-chart-loaded.ts
│   │
│   ├── components/               # React components (shell + workspace widgets)
│   │   ├── shell/                # Header, Dock, Footer, BootLoader, MobileTabBar
│   │   ├── overview/             # Overview dashboard widgets
│   │   ├── tune/                 # Tune workspace widgets
│   │   ├── compare/              # Compare workspace widgets
│   │   ├── compendium/           # Compendium/Strings/Leaderboard widgets
│   │   ├── optimize/             # Optimize results widgets
│   │   ├── find-my-build/        # FMB wizard components
│   │   ├── strings/              # String compendium widgets
│   │   ├── leaderboard/          # Leaderboard widgets
│   │   └── HardwareMount.tsx     # Utility for mounting React islands
│   │
│   ├── context/                  # React context providers
│   │   └── ThemeContext.tsx
│   │
│   ├── data/                     # Data layer
│   │   ├── loader.ts             # Runtime catalog loading (initCatalog)
│   │   ├── generated.ts          # Generated data module (DO NOT EDIT)
│   │   └── derived-facets.ts     # Computed data facets
│   │
│   ├── engine/                   # Prediction engine (pure functions)
│   │   ├── types.ts              # Core type definitions
│   │   ├── frame-physics.ts      # L0: Frame base score calculation
│   │   ├── string-profile.ts     # L1: String profile + L2a: String-frame mods
│   │   ├── tension.ts            # L2b: Tension modifier
│   │   ├── hybrid.ts             # L3: Hybrid interaction
│   │   ├── composite.ts          # Final blend + OBS + identity
│   │   ├── constants.ts          # Engine constants
│   │   └── index.ts              # Public API exports
│   │
│   ├── hooks/                    # React hooks
│   │   ├── useStore.ts           # Zustand selectors
│   │   ├── useCompare.ts         # Compare-specific hooks
│   │   └── useTheme.ts           # Theme context hook
│   │
│   ├── pages/                    # Route wrapper components
│   │   ├── Workspaces.tsx        # Lazy-loaded workspace exports
│   │   ├── Overview.tsx          # Overview workspace (eager)
│   │   ├── Tune.tsx              # Tune workspace
│   │   ├── Compare.tsx           # Compare workspace
│   │   ├── Optimize.tsx          # Optimize workspace
│   │   ├── Compendium.tsx        # Compendium workspace
│   │   └── HowItWorks.tsx        # Documentation page
│   │
│   ├── routing/                  # Routing utilities
│   │   ├── modePaths.ts          # Path <-> mode mapping
│   │   └── routerNavigate.ts     # Programmatic navigation
│   │
│   ├── runtime/                  # Cross-page coordination
│   │   ├── coordinator.ts        # Refresh coordinator
│   │   ├── contracts.ts          # DOM/window contract validation
│   │   └── diagnostics.ts        # Debug utilities
│   │
│   ├── state/                    # State management
│   │   ├── useAppStore.ts        # Zustand store (single source of truth)
│   │   ├── imperative.ts         # Vanilla TS accessors
│   │   ├── selectors.ts          # Pure selectors over AppState
│   │   ├── setup-from-loadout.ts # Loadout → setup resolution
│   │   ├── setup-sync.ts         # Current setup + compendium sync
│   │   ├── loadout.ts            # Saved loadout CRUD
│   │   ├── active-loadout-storage.ts # Active loadout persistence
│   │   ├── compare-slots.ts      # Compare slot state management
│   │   ├── presets.ts            # Top builds generation
│   │   └── legacy-storage.ts     # Legacy localStorage migration
│   │
│   ├── ui/                       # Imperative UI orchestration
│   │   ├── pages/                # Page-level orchestration modules
│   │   │   ├── shell.ts          # Shell initialization
│   │   │   ├── overview.ts       # Overview page logic
│   │   │   ├── tune.ts           # Tune page logic
│   │   │   ├── compare/          # Compare page logic
│   │   │   ├── optimize.ts       # Optimize page logic
│   │   │   ├── compendium.ts     # Compendium page logic
│   │   │   ├── strings.ts        # Strings page logic
│   │   │   ├── leaderboard.ts    # Leaderboard page logic
│   │   │   ├── find-my-build.ts  # FMB wizard logic
│   │   │   └── my-loadouts.ts    # My Loadouts page logic
│   │   │
│   │   ├── components/           # Shared UI components (imperative)
│   │   └── shared/               # Shared UI utilities
│   │
│   ├── utils/                    # Utility functions
│   │   ├── helpers.ts
│   │   ├── performance.ts
│   │   ├── share.ts
│   │   └── performance-*.ts      # Performance scoring utilities
│   │
│   ├── compute/                  # Computation utilities
│   │   ├── setup-attributes.ts
│   │   ├── fmb-rank.ts
│   │   ├── optimizer-scan.ts
│   │   └── recommendation-pool.ts
│   │
│   └── workers/                  # Web Workers
│       ├── engine-worker.ts
│       ├── engine-worker-client.ts
│       └── engine-worker-protocol.ts
│
├── pipeline/                     # Data pipeline
│   ├── data/
│   │   ├── frames.json           # Racquet database (SOURCE OF TRUTH)
│   │   ├── strings.json          # String database (SOURCE OF TRUTH)
│   │   └── canaries.json         # Regression test expectations
│   │
│   ├── schemas/                  # JSON schemas for validation
│   │   ├── frame.schema.json
│   │   └── string.schema.json
│   │
│   ├── scripts/                  # Pipeline scripts (run with tsx)
│   │   ├── validate.ts           # JSON schema validation
│   │   ├── export-to-app.ts      # Generate app data modules
│   │   ├── canary-test.ts        # Regression testing
│   │   ├── ingest.ts             # Frame/string ingestion
│   │   ├── scrape-twu.ts         # TWU racquet scraping
│   │   ├── scrape-twu-strings.ts # TWU string scraping
│   │   ├── estimate.ts           # String scoring stats
│   │   └── calibrate.ts          # Coefficient calibration
│   │
│   └── engine/                   # Pipeline-only engine utilities
│
├── tests/                        # Test files
│   └── runtime-hardening.test.ts # Runtime contract tests
│
├── docs/                         # Documentation
│   ├── README.md                 # Documentation index
│   ├── Getting-Started.md        # Setup and usage guide
│   ├── Frame-ingestion.md        # Frame ingestion details
│   ├── REACT-MIGRATION-GUIDE.md  # Zero-Pixel Protocol
│   └── REACT-MIGRATION-PLAN.md   # Migration roadmap
│
└── tools/                        # Development tools
    └── frame-gui/                # Desktop GUI for frame entry
```

---

## Build and Development Commands

### Development

```bash
npm run dev              # Start Vite dev server (opens automatically)
npm run typecheck        # TypeScript strict check (must pass with zero errors)
npm run build            # Production build → dist/
npm run preview          # Preview production build
```

### Data Pipeline

```bash
npm run pipeline         # Full pipeline: validate + export + canary
npm run validate         # Validate frames.json/strings.json against schemas
npm run export           # Regenerate src/data/generated.ts and data.ts
npm run export:verify    # Export + run canary tests
npm run canary           # Run regression tests only
npm run canary:baseline  # Re-record canary baselines (after intentional changes)
```

### Data Ingestion

```bash
npm run ingest:frame     # Interactive frame (racquet) ingestion
npm run ingest:string    # Interactive string ingestion
npm run scrape:twu       # Scrape racquet data from Tennis Warehouse University
npm run scrape:twu-strings # Scrape string data from TWU
npm run enrich:twu       # Enrich TWU CSV data
npm run estimate         # String scoring accuracy statistics
npm run calibrate        # Re-fit string estimation coefficients
```

### Testing

```bash
npm run test:runtime     # Runtime hardening tests (refresh plans, DOM contracts)
```

### Pre-Commit Checklist (REQUIRED)

Before every commit, run:

```bash
npm run typecheck && npm run canary && npm run build && npm run test:runtime
```

---

## Runtime Architecture

### Startup Flow

1. **`src/main.tsx`** (Vite entry):
   - Calls `init16x19Favicon()` to start favicon animation
   - Calls `initCatalog()` to fetch `public/data/catalog.json`
   - Dynamically imports `App.tsx` after catalog resolves
   - Mounts React root to `#root`

2. **`src/App.tsx`**:
   - Sets up `ThemeProvider`, `BrowserRouter`
   - Registers router navigation helpers
   - Syncs route changes to store mode
   - Renders `ShellLayout` with header, dock, workspace, footer
   - Lazy-loads workspace routes via `React.lazy()`

3. **`src/bridge/installWindowBridge.ts`**:
   - Runs vanilla app initialization after React mounts
   - Handles boot animation sequence
   - Sets up delegated event listeners

### State Management

**Single Source of Truth:** Zustand store (`src/state/useAppStore.ts`)

| Module | Purpose |
|--------|---------|
| `useAppStore.ts` | Zustand store with persistence middleware |
| `imperative.ts` | Vanilla TS accessors: `getActiveLoadout()`, `subscribe(key, cb)` |
| `selectors.ts` | Pure selectors: `selectCurrentSetup(state)` |
| `setup-from-loadout.ts` | `getSetupFromLoadout()` with caching |
| `setup-sync.ts` | `getCurrentSetup()` and compendium sync |
| `loadout.ts` | Saved loadout CRUD operations |
| `active-loadout-storage.ts` | Active loadout localStorage helpers |

**Persistence Contract:**
- Active loadout and saved loadouts survive page refresh
- Boot restore happens in `src/ui/pages/shell.ts` during `Shell.init()`
- Compare slots are also persisted

### Data Flow

```
User Action → Zustand Store → Selectors → Component Re-render
                    ↓
            LocalStorage (auto-persist)
                    ↓
            Cross-page Sync (coordinator.ts)
```

### Runtime Coordination

`src/runtime/coordinator.ts` computes refresh plans when state changes:

```typescript
// Example: active loadout change in overview mode
getRefreshPlan('overview', { activeLoadout: true })
// → { dockPanel: true, dockContext: true, overview: true, tune: false, ... }
```

Runtime bridges (`*-runtime-bridge.ts` files) are callback registries for lazy-loaded modules.

### Prediction Engine

Pure TypeScript functions in `src/engine/` — deterministic, no side effects.

**Pipeline Stages:**

| Stage | Function | Description |
|-------|----------|-------------|
| L0 | `calcFrameBase()` | 11 frame base scores from physics |
| L0.5 | Frame novelty pass | Contradiction modeling from `_meta`, `_novelty` |
| L1 | `calcBaseStringProfile()` | 7 string profile scores |
| L2a | `calcStringFrameMod()` | 6 string-frame interaction deltas |
| L2b | `calcTensionModifier()` | 8 tension deltas (pattern-aware) |
| L3 | `calcHybridInteraction()` | 8 hybrid pairing deltas |
| Final | `predictSetup()` | Weighted blend: frame 72% + string 28% |
| OBS | `computeCompositeScore()` | 0-100 composite score |
| Identity | `generateIdentity()` | Archetype + description + tags |

**Frame/String Blend Weights:**
- Frame: 72%
- String: 28%

**Exceptions (single-source attributes):**
- Stability, Forgiveness, Maneuverability: Frame only
- Launch: Frame + mods only
- Durability, Playability: String + tension only

### Chart Loading

Chart.js is loaded dynamically via `src/chart/ensure-chart-loaded.ts`:

```typescript
const Chart = await ensureChartLoaded();
// Chart.register(...) happens once
// globalThis.Chart set for Chart.getChart() access
```

Used by: Overview radar, Tune sweep chart, Compare radar.

---

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** — all `src/**/*.ts` and `src/**/*.tsx` must pass `npm run typecheck`
- Import paths use `.js` extensions (bundler resolves to `.ts`)
- No implicit `any` — explicit types required
- Prefer `interface` over `type` for object shapes
- Use `readonly` arrays where mutation isn't needed

### React Components

- Functional components with hooks
- Props interfaces named `{ComponentName}Props`
- Container/presenter pattern: dumb components receive view-models
- Use `useAppStore` selectors or `hooks/useStore.ts` for state access
- `flushSync` around `createRoot().render()` for immediate mounting

### Styling

- Tailwind CSS utilities preferred
- Runtime-generated class strings must stay verbatim (Vite scans static strings)
- Custom CSS in `style.css` for design tokens and complex animations
- Color tokens via CSS variables, mapped in Tailwind config

### File Naming

- React components: PascalCase (`OverviewHero.tsx`)
- Utility modules: kebab-case (`setup-from-loadout.ts`)
- View-models: suffix with `-vm.ts` (`overview-hero-vm.ts`)
- Runtime bridges: suffix with `-runtime-bridge.ts`

---

## Testing Strategy

### Automated Tests

**Runtime Hardening Tests** (`tests/runtime-hardening.test.ts`):
- Refresh plan computation
- DOM contract validation
- Window binding validation
- Compare slot normalization

**Canary Tests** (`pipeline/scripts/canary-test.ts`):
- Regression tests for OBS scores
- Frame novelty profile validation
- Archetype and identity expectations

### Pre-Commit Verification

```bash
npm run typecheck && npm run canary && npm run build && npm run test:runtime
```

### Manual Smoke Tests

After UI or engine changes, verify:
- Overview: hero, radar chart, stat bars, fit profile, warnings
- Tune: delta card, OBS, WTTN, recommendations, loadout switching, slider apply
- Compare: slots, editor modal, radar chart, diff battery
- Compendium: frame roster, string modulator, top builds
- Dock: create, save, activate, delete with confirmation
- Leaderboard: tab roundtrip
- Refresh persistence: active and saved loadouts survive refresh

---

## Data Pipeline Details

### Source of Truth (EDIT THESE)

- `pipeline/data/frames.json` — Racquet database
- `pipeline/data/strings.json` — String database
- `pipeline/data/canaries.json` — Regression test expectations

### Generated Files (NEVER HAND-EDIT)

- `src/data/generated.ts` — App data module
- `data.ts` — Root compatibility re-export
- `public/data/catalog.json` — Runtime catalog (fetched at boot)

### Frame Schema

**Required fields:**
- `id`: Kebab-case unique identifier (`^[a-z0-9-]+$`)
- `name`: Full racquet name (e.g., "Babolat Pure Aero 100 318g")
- `year`: Release year
- `headSize`: Head size in sq inches
- `strungWeight`: Strung weight in grams
- `swingweight`: Swingweight in kg·cm² (**lowercase 'w'**)
- `stiffness`: RA stiffness rating
- `beamWidth`: Beam width profile in mm (1-3 values)
- `pattern`: String pattern (e.g., "16x19")
- `tensionRange`: [low, high] in lbs
- `balance`: Balance point in cm from butt

**Pipeline-only fields:**
- `_meta`: Technology bonuses (`aeroBonus`, `comfortTech`, `spinTech`, `genBonus`)
- `_novelty`: Reviewer-authored contradiction hints
- `_provenance`: Data lineage

### Export Flow

```
npm run export
  ↓
1. Strip internal fields (_provenance, _meta, _novelty, brand, _staging)
2. Extract _meta → FRAME_META
3. Fold _novelty + rarity → FRAME_NOVELTY_PROFILE
4. Write src/data/generated.ts
5. Write data.ts
6. Write public/data/catalog.json
```

### Ingestion Methods

1. **Interactive CLI:** `npm run ingest:frame` / `npm run ingest:string`
2. **Batch CSV:** `npx tsx pipeline/scripts/ingest.ts --type frame --csv path.csv`
3. **Desktop GUI:** `cd tools/frame-gui && npm start`

---

## Critical Rules

### Data Integrity

- **NEVER** edit `src/data/generated.ts`, `data.ts`, or `public/data/catalog.json` directly
- Always modify JSON in `pipeline/data/` and run `npm run pipeline`
- After fresh clone, run `npm run export` before `npm run dev`

### Naming Conventions

- Field name: `swingweight` (lowercase 'w'), NOT `swingWeight`
- Attribute: `maneuverability` (full spelling)

### State Access

- React: Use `useAppStore` selectors or `hooks/useStore.ts`
- Vanilla/Runtime: Import from `state/imperative.ts` or call `useAppStore.getState()`
- **Never** duplicate global state or use ad-hoc globals

### Styling

- Both `@tailwindcss/vite` and inline Tailwind config in `index.html` are load-bearing
- Runtime-generated utility strings must stay verbatim
- Dark mode: `data-theme="dark"` on `<html>`

### Migration Pattern

React migration follows the **Strangler Fig** pattern:
1. Migrate widget-by-widget, not page-by-page
2. Mount React islands into existing imperative modules via `createRoot`
3. Use pure view-models (`*-vm.ts`) for data transformation
4. Maintain 1:1 DOM structure parity (Zero-Pixel Protocol)
5. See `docs/REACT-MIGRATION-GUIDE.md` for full protocol

---

## Deployment

### GitHub Pages (Primary)

Auto-deploys on push to `main` via `.github/workflows/deploy.yml`:

```bash
git push origin main
```

Actions: `https://github.com/zaldytb/16X19/actions`

### Vercel (Mirror)

- `https://loadout-lab.vercel.app`
- `https://16x19.vercel.app`

Both mirrors auto-deploy from the same repository.

---

## Common Pitfalls

1. **Stale client state** — A "working" UI can show wrong numbers. Verify `useAppStore` / `getCurrentSetup()` when scores look off.

2. **Tune sensitivity** — When changing Tune, verify together: delta card, OBS in Tune, WTTN, recommendations, loadout switching while Tune is open, slider → apply.

3. **Persistence contract** — Active loadout and saved loadouts are expected to survive refresh. Check both paths when debugging refresh regressions.

4. **Chart.js lifecycle** — Charts must be destroyed before canvas removal. Use `ensureChartLoaded()` and proper cleanup.

5. **Compare slot validation** — Invalid slots are normalized back to empty. Check `normalizeCompareSlots()` behavior.

6. **Lazy route root invalidation** — React islands in lazy routes need `_ensure*ReactRoot` invalidation to survive unmount.

---

## Further Reference

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Claude Code specific notes and engine reference |
| `README.md` | Human-readable project overview |
| `docs/Getting-Started.md` | Setup, ingest, pipeline guide |
| `docs/Frame-ingestion.md` | Frame ingestion deep-dive |
| `docs/REACT-MIGRATION-GUIDE.md` | Zero-Pixel Protocol for React migration |
| `docs/REACT-MIGRATION-PLAN.md` | Migration roadmap and targets |
| `ts-migration-plan.md` | TypeScript migration snapshot |

---

## Debugging Notes

### Startup Issues

Trace `runVanillaAppInit()` and boot helpers in `src/bridge/installWindowBridge.ts`.

### State Issues

Check:
1. `useAppStore.getState()` for current values
2. `src/state/imperative.ts` for vanilla accessors
3. LocalStorage in DevTools → Application → Local Storage

### Routing/Mode Sync

Route changes flow through `App.tsx` and `src/routing/modePaths.ts`. `pathToMode()` aliases `/strings` and `/leaderboard` to the Compendium shell mode.

### DOM Contract Failures

Run `npm run test:runtime` to check DOM contracts and window bindings.
