# Tennis Loadout Lab

**Frame × String × Tension Prediction Engine**

Physics-based tennis equipment prediction tool. Calculates composite performance scores across 11 attributes by modeling frame physics, string properties, tension effects, and hybrid interactions.

Vite + ES Modules + Tailwind CSS. Deploys to GitHub Pages and Vercel.

## Quick Start

```bash
npm install
npm run dev        # Development server
npm run build      # Production build
npm run typecheck  # TypeScript type check (engine only)
```

## Architecture

### Source Layout

```
src/
├── engine/              # Prediction engine — TypeScript, strict mode
│   ├── types.ts         # All domain interfaces and type aliases
│   ├── constants.ts     # GAUGE_OPTIONS, STAT_KEYS, OBS_TIERS, etc.
│   ├── frame-physics.ts # calcFrameBase, normalizeRawSpecs
│   ├── string-profile.ts# calcBaseStringProfile, gauge modifiers
│   ├── tension.ts       # calcTensionModifier, buildTensionContext
│   ├── hybrid.ts        # calcHybridInteraction
│   ├── composite.ts     # predictSetup, computeCompositeScore, generateIdentity
│   └── index.ts         # barrel exports
│
├── state/               # State management (JS)
│   ├── loadout.js       # CRUD for loadouts
│   ├── setup-sync.js    # getCurrentSetup, state sync
│   └── presets.js       # Top builds generation
│
├── ui/                  # UI components (JS)
│   ├── components/
│   │   └── searchable-select.js
│   ├── pages/
│   │   └── leaderboard.js
│   ├── theme.js         # Dark/light mode
│   └── nav.js           # Navigation helpers
│
├── data/                # Data loading
│   └── loader.js        # RACQUETS, STRINGS, FRAME_META imports
│
└── utils/               # Utilities
    └── share.js         # URL encoding, export/import
```

### Prediction Engine (4-Layer Pipeline)

| Layer | Function | Description |
|-------|----------|-------------|
| L0 | `calcFrameBase()` | Normalizes raw specs → 11 attribute scores via weighted linear models + sigmoid compression |
| L1 | `calcBaseStringProfile()` + `calcStringFrameMod()` | String scoring (TWU data) + frame coupling deltas |
| L2 | `calcTensionModifier()` | Pattern-aware tension effects (open/dense/standard) |
| L3 | `calcHybridInteraction()` | Mains/crosses material pairing bonuses |

Composite score (OBS) maps to a 10-tier ranking system ("Delete This" → "Max Aura"). All engine functions are pure — same inputs always produce identical outputs. 5 canary tests guard against regression on every export.

### TypeScript Engine

`src/engine/` is fully TypeScript with `strict: true`. Key types in `types.ts`:

| Type | Description |
|------|-------------|
| `Racquet` | Frame data shape (matches data.js fields — note: `swingweight` lowercase) |
| `StringData` | String entry with `twScore: TwScore`, gauge, material, shape |
| `StringConfig` | Discriminated union — `HybridStringConfig \| FullbedStringConfig` |
| `SetupAttributes` | 11 numeric attributes (spin, power, control, …) |
| `SetupStats` | `SetupAttributes + _debug?` — return type of `predictSetup` |
| `FrameBaseScores` | 11-attr output of `calcFrameBase` |
| `StringProfileScores` | 7-attr output of `calcBaseStringProfile` |
| `TensionContext` | Context object for OBS sanity penalty calculation |

`moduleResolution: "bundler"` lets `.js` imports in `.ts` files resolve to `.ts` — no import path changes needed. `app.js` and all other `src/` files remain plain JS.

### Bible & Compendium Pages

**Racket Bible** (`comp-tab-rackets`): Browse racquets with hero layout (weight anchor, spec strip, console output). String Modulator panel for injection preview with fullbed/hybrid toggle, gauge selection, and real-time battery bar preview. Top Builds grid with OBS-ranked string recommendations.

**String Compendium** (`comp-tab-strings`): Mirror architecture to Racket Bible. Browse strings by material, shape, stiffness. Hero shows TWU composite score. String Telemetry displays intrinsic characteristics. **Frame Injection** modulator — select frame, configure gauge/tension, preview how string affects frame stats. Supports hybrid configurations with independent crosses string selection.

## Data Layer

Equipment data lives in `pipeline/data/` as JSON files. The browser loads `data.js` which is generated from these files.

- `pipeline/data/frames.json` — racquet database (source of truth)
- `pipeline/data/strings.json` — string database (source of truth)
- `data.js` — generated, never edit directly

### Design System

"Digicraft Brutalism" — monochrome base (#1A1A1A void, #DCDFE2 platinum, #5E666C storm) with #FF4500 accent orange for data visualization. Inter + JetBrains Mono typography. Halftone grain textures. No drop shadows.

**Tailwind CSS** (CDN, inline config in `index.html`):
- Dark mode: `[data-theme="dark"]` selector
- Custom colors: `dc-void`, `dc-platinum`, `dc-storm`, `dc-accent`, `dc-red`
- Typography: Elephant (hero: 4.5rem), Obs (2.5-3.5rem), Mouse (9px labels)

## Data Pipeline

### Adding new equipment

```bash
# Interactive
npm run ingest:frame
npm run ingest:string

# Batch CSV import
node pipeline/scripts/ingest.js --type frame --csv path/to/file.csv
node pipeline/scripts/ingest.js --type string --csv path/to/file.csv

# After any addition
npm run pipeline
```

### Visual tools (browser-based, no install)

- `tools/frame-editor.html` — spreadsheet-style batch frame editor, exports CSV
- `tools/twu-import.html` — AI-assisted extraction from TWU pages using Claude API

### TWU bulk scraping

```bash
# Scrape all racquets from TWU comparison database
npm run scrape:twu

# Scrape polyester string data
npm run scrape:twu-strings

# Enrich scraped frames with inferred specs (beamWidth, pattern, etc.)
npm run enrich:twu -- --input pipeline/data/twu-scrape-YYYY-MM-DD.csv --filter --dedup

# Enrich scraped strings with gauge, shape, identity
npm run enrich:twu-strings -- --input pipeline/data/twu-strings-raw-YYYY-MM-DD.csv --filter
```

### Pipeline commands

| Command | Description |
|---------|-------------|
| `npm run validate` | Check all data against schemas |
| `npm run export` | Regenerate data.js from JSON |
| `npm run export:verify` | Regenerate + canary regression test |
| `npm run canary` | Run 5 regression canaries |
| `npm run canary:baseline` | Re-record canary expected values |
| `npm run typecheck` | TypeScript type check (engine only, zero errors) |
| `npm run estimate` | Show string estimation accuracy stats |
| `npm run calibrate` | Re-fit string estimation coefficients |
| `npm run pipeline` | Full validate + export + verify |
| `npm run scrape:twu` | Scrape TWU racquet database |
| `npm run scrape:twu-strings` | Scrape TWU string database |
| `npm run enrich:twu` | Enrich scraped frame CSV |

### File structure

```
├── index.html              ← app shell (Tailwind CDN config inline)
├── app.js                  ← main app (~10,700 lines, imports from src/)
├── style.css               ← Digicraft design system (Tailwind + custom)
├── data.js                 ← generated from pipeline (never edit)
├── vite.config.js          ← Vite configuration
├── tsconfig.json           ← TypeScript config (engine only, strict)
├── package.json
│
├── src/
│   ├── main.js             ← Vite entry point, bridges engine to window
│   ├── engine/             ← prediction engine (TypeScript, strict mode)
│   │   ├── types.ts        ← domain interfaces
│   │   ├── constants.ts
│   │   ├── frame-physics.ts
│   │   ├── string-profile.ts
│   │   ├── tension.ts
│   │   ├── hybrid.ts
│   │   ├── composite.ts
│   │   └── index.ts
│   ├── state/              ← state management (JS)
│   ├── ui/                 ← UI components (JS)
│   ├── data/               ← data loading (JS)
│   └── utils/              ← utilities (JS)
│
├── pipeline/
│   ├── data/
│   │   ├── frames.json         ← racquet database (source of truth)
│   │   ├── strings.json        ← string database (source of truth)
│   │   └── canaries.json       ← regression test definitions
│   ├── schemas/
│   │   ├── frame.schema.json
│   │   └── string.schema.json
│   ├── scripts/
│   │   ├── validate.js
│   │   ├── estimate.js
│   │   ├── calibrate.js
│   │   ├── ingest.js
│   │   ├── canary-test.js
│   │   ├── export-to-app.js
│   │   ├── scrape-twu.js
│   │   ├── scrape-twu-strings.js
│   │   ├── enrich-twu-csv.js
│   │   └── enrich-twu-strings.js
│   └── engine/
│       └── core.js             ← portable engine copy (Node.js, used by pipeline)
│
├── tools/
│   ├── frame-editor.html       ← visual batch frame editor
│   └── twu-import.html         ← AI-assisted TWU data extraction
│
└── .github/workflows/
    └── deploy.yml              ← GitHub Pages auto-deployment
```

### Key principles

- `pipeline/data/*.json` is the source of truth
- `data.js` is generated — never edit directly
- `app.js` imports engine from `src/engine/` — no inline engine code
- The engine is deterministic — same inputs always produce same outputs
- Canary tests guard against regression on every export
- Setup syncing ensures consistency across all pages (see below)

## Deployment

### GitHub Pages (Primary)

Pushes to `main` auto-deploy via GitHub Actions:

```bash
git push origin main
```

Check status: https://github.com/zaldytb/loadout-lab/actions

Live at: https://zaldytb.github.io/loadout-lab/

### Vercel (Mirror)

Also deploys to Vercel on every push:
https://loadout-lab.vercel.app

## Setup Syncing

The app maintains a single source of truth: the **active loadout** (frame + strings + tensions). All pages sync to this state:

### Automatic Sync Points

| Page | Sync Behavior |
|------|---------------|
| **Overview** | Always shows active loadout stats |
| **Tune** | Initializes with active racquet + strings, modifications update active loadout |
| **Compare** | Uses active loadout as first slot, survives roundtrips |
| **Optimize** | Searches from current active setup as baseline |
| **Racket Bible** | On entry: auto-selects active racket frame, syncs strings to modulator |
| **String Compendium** | On entry: auto-selects active strings, syncs frame to injector |

### User Workflows

**Browsing different rackets** (no loadout → new setup):
```
Racket Bible → Select Frame A → Apply → Creates loadout + activates
→ Browse Frame B → Fresh modulator → Apply → Overwrites with Frame B setup
```

**Modifying active setup** (existing loadout → update):
```
Overview → Tune → Change tension → Save → Active loadout updated
→ Racket Bible → Shows same frame + strings → Modify → Apply → Updates active
```

**Hybrid mode consistency**:
```
Racket Bible → Hybrid mode → Select mains + crosses → Apply
→ Any page → Shows hybrid setup
→ Back to Racket Bible → Hybrid mode preserved, strings populated
```

### Implementation

Sync is handled by `getCurrentSetup()` which returns the active configuration. Mode switching triggers re-sync via `switchMode()`. The Racket Bible uses `_compSyncWithActiveLoadout()` to ensure the displayed frame matches the active loadout on every entry.
