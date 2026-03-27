# Tennis Loadout Lab — Agent Documentation

## Project Overview

Tennis Loadout Lab (branded as "16X19") is a physics-based tennis equipment analysis tool that predicts how a tennis racket and string setup will perform across 11 attributes (power, spin, control, comfort, feel, stability, forgiveness, launch, maneuverability, durability, playability).

The application enables users to:
- Browse a database of tennis rackets (Racket Bible)
- Browse a database of tennis strings (String Compendium)
- Configure racket + string + tension combinations
- View performance predictions and composite scores
- Compare multiple setups side-by-side
- Get optimization recommendations
- Save and share loadouts

**Primary URL:** https://zaldytb.github.io/loadout-lab/  
**Mirror:** https://loadout-lab.vercel.app

---

## Technology Stack

| Category | Technology |
|----------|------------|
| **Build Tool** | Vite 8.x |
| **Language** | TypeScript 6.x (strict mode) + JavaScript (legacy) |
| **Styling** | Tailwind CSS 4.x (CDN) + Custom CSS |
| **Package Manager** | npm |
| **Runtime** | Node.js 20+ |
| **Charts** | Chart.js (via CDN) |
| **Deployment** | GitHub Pages + Vercel |

### Key Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.js` | Vite build configuration |
| `tsconfig.json` | TypeScript compiler settings (strict mode) |
| `package.json` | Dependencies and npm scripts |
| `vercel.json` | Vercel deployment configuration |
| `index.html` | App shell with inline Tailwind config |

---

## Project Structure

```
loadout-lab/
├── index.html                  # App shell, Tailwind CDN config, main HTML
├── app.js                      # Main application (~10,700 lines), imports from src/
├── style.css                   # Custom CSS (Digicraft design system)
├── data.js                     # GENERATED: Equipment data (never edit directly)
│
├── src/
│   ├── main.js                 # Vite entry point, bridges modules to window
│   │
│   ├── engine/                 # Prediction engine (TypeScript, strict mode)
│   │   ├── types.ts            # Domain interfaces (Racquet, StringData, Loadout, etc.)
│   │   ├── constants.ts        # GAUGE_OPTIONS, OBS_TIERS, STAT_KEYS, etc.
│   │   ├── frame-physics.ts    # calcFrameBase, normalizeRawSpecs
│   │   ├── string-profile.ts   # calcBaseStringProfile, gauge modifiers
│   │   ├── tension.ts          # calcTensionModifier, buildTensionContext
│   │   ├── hybrid.ts           # calcHybridInteraction
│   │   ├── composite.ts        # predictSetup, computeCompositeScore, generateIdentity
│   │   └── index.ts            # Barrel exports (public API)
│   │
│   ├── state/                  # State management (TypeScript)
│   │   ├── store.ts            # Centralized state store (single source of truth)
│   │   ├── loadout.ts          # CRUD for loadouts (delegates to store)
│   │   ├── setup-sync.ts       # getCurrentSetup, state sync
│   │   ├── presets.ts          # Top builds generation
│   │   └── index.ts            # Public API exports
│   │
│   ├── ui/                     # UI components and pages
│   │   ├── components/         # Reusable UI components
│   │   │   ├── searchable-select.ts    # Dropdown with search
│   │   │   ├── dock-collapse.ts        # Dock collapse behavior
│   │   │   ├── dock-create.ts          # Loadout creation form
│   │   │   ├── dock-panel.ts           # Dock panel logic
│   │   │   ├── dock-renderers.ts       # Dock rendering functions
│   │   │   ├── mobile-dock.ts          # Mobile dock behavior
│   │   │   └── obs-animation.ts        # OBS score animations
│   │   ├── pages/              # Page-specific modules
│   │   │   ├── overview.ts     # Overview/dashboard page
│   │   │   ├── tune.ts         # Tension tuning page
│   │   │   ├── compare.ts      # Comparison page
│   │   │   ├── optimize.ts     # Optimization page
│   │   │   ├── find-my-build.ts # Wizard for recommendations
│   │   │   ├── my-loadouts.ts  # Saved loadouts list
│   │   │   └── leaderboard.js  # Leaderboard (JavaScript)
│   │   ├── shared/             # Shared UI utilities
│   │   │   ├── renderers.ts    # Shared rendering functions
│   │   │   ├── recommendations.ts # Recommendation logic
│   │   │   ├── presets.ts      # Preset management
│   │   │   └── helpers.ts      # DOM helpers
│   │   ├── nav.ts              # Navigation helpers
│   │   └── theme.ts            # Dark/light mode
│   │
│   ├── data/                   # Data loading
│   │   └── loader.ts           # RACQUETS, STRINGS, FRAME_META imports
│   │
│   └── utils/                  # Utilities
│       ├── share.ts            # URL encoding, export/import
│       └── helpers.ts          # Shared utilities
│
├── pipeline/                   # Data pipeline (Node.js scripts)
│   ├── data/
│   │   ├── frames.json         # Racquet database (source of truth)
│   │   ├── strings.json        # String database (source of truth)
│   │   └── canaries.json       # Regression test definitions
│   ├── schemas/
│   │   ├── frame.schema.json   # JSON Schema for frame validation
│   │   └── string.schema.json  # JSON Schema for string validation
│   ├── scripts/
│   │   ├── validate.js         # Validate data against schemas
│   │   ├── export-to-app.js    # Generate data.js from JSON
│   │   ├── canary-test.js      # Regression testing
│   │   ├── ingest.js           # Interactive/batch data ingestion
│   │   ├── scrape-twu.js       # TWU racquet scraping
│   │   ├── scrape-twu-strings.js # TWU string scraping
│   │   ├── enrich-twu-csv.js   # Enrich scraped data
│   │   ├── estimate.js         # String estimation accuracy
│   │   └── calibrate.js        # Re-fit coefficients
│   └── engine/
│       └── leaderboard-v2.js   # Node.js version of engine
│
├── tools/                      # Browser-based tools
│   ├── frame-editor.html       # Visual batch frame editor
│   └── twu-import.html         # AI-assisted TWU extraction
│
├── docs/                       # Documentation
│   └── Getting-Started.md
│
└── .github/workflows/
    └── deploy.yml              # GitHub Pages auto-deployment
```

---

## Build and Development Commands

### Development
```bash
npm run dev        # Start Vite dev server
npm run typecheck  # TypeScript type check (engine only, zero errors required)
```

### Production Build
```bash
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
```

### Data Pipeline Commands
```bash
# Data validation and export
npm run validate       # Check all data against schemas
npm run export         # Regenerate data.js from JSON
npm run export:verify  # Regenerate + canary regression test
npm run pipeline       # Full validate + export + verify

# Regression testing
npm run canary         # Run 5 regression canaries
npm run canary:baseline # Re-record canary expected values

# Data ingestion
npm run ingest:frame   # Interactive frame ingestion
npm run ingest:string  # Interactive string ingestion

# TWU scraping (Tennis Warehouse University)
npm run scrape:twu         # Scrape TWU racquet database
npm run scrape:twu-strings # Scrape TWU string database
npm run enrich:twu         # Enrich scraped frame CSV

# Calibration
npm run estimate   # Show string estimation accuracy stats
npm run calibrate  # Re-fit string estimation coefficients
```

---

## Code Style Guidelines

### TypeScript (src/engine/, src/state/)

- **Strict mode enabled**: `noImplicitAny`, `strictNullChecks`
- **No runtime guards**: Types are compile-time only; don't add `instanceof` / `typeof` checks
- **`[key: string]: unknown`** on `Racquet` and `StringData` is intentional — data.js has extra fields
- **Import paths**: Use `.js` extensions in `.ts` files — `moduleResolution: "bundler"` resolves them automatically
- **Types over interfaces**: Either is acceptable, but be consistent within a file

### JavaScript (app.js, src/ui/)

- **ES Modules**: All imports use ES module syntax
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Comments**: JSDoc for exported functions
- **No var**: Use `const` and `let` only

### CSS/Tailwind

- **Design tokens**: Always use `dc-*` colors, never hardcode:
  ```css
  /* Bad */
  color: #gray-200;
  /* Good */
  color: dc-platinum;
  ```
- **Dark mode**: Use `dark:` prefix for conditional styling:
  ```html
  <span class="text-dc-void dark:text-dc-platinum">Text</span>
  ```
- **Typography scale**:
  - Hero: `text-hero` (clamp 2.8rem to 4.5rem)
  - Section: `text-obs` (clamp 2.5rem to 3.5rem)
  - Labels: `text-mouse` (9px)

---

## Architecture Details

### Prediction Engine (4-Layer Pipeline)

The engine is deterministic — same inputs always produce identical outputs.

| Layer | Function | Description |
|-------|----------|-------------|
| L0 | `calcFrameBase()` | Normalizes raw specs → 11 attribute scores via weighted linear models + sigmoid compression |
| L1 | `calcBaseStringProfile()` + `calcStringFrameMod()` | String scoring (TWU data) + frame coupling deltas |
| L2 | `calcTensionModifier()` | Pattern-aware tension effects (open/dense/standard) |
| L3 | `calcHybridInteraction()` | Mains/crosses material pairing bonuses |

**Composite score (OBS)** maps to a 10-tier ranking system ("Delete This" → "Max Aura").

### State Management

Centralized store in `src/state/store.ts` is the single source of truth:

```
src/state/store.ts
    ├─ _activeLoadout: Loadout | null
    ├─ _savedLoadouts: Loadout[]
    ├─ getActiveLoadout(): Loadout | null
    ├─ getSavedLoadouts(): Loadout[]
    ├─ setActiveLoadout(lo): void  (+ notifies subscribers)
    ├─ setSavedLoadouts(arr): void (+ notifies subscribers)
    ├─ subscribe(key, listener): () => void  (pub/sub)
```

**Backward compatibility**: `app.js` has `Object.defineProperty` shims on `window` so inline HTML handlers referencing `activeLoadout` and `savedLoadouts` continue to work.

### Setup Syncing

The app maintains consistency between the active loadout and all pages through `getCurrentSetup()`:

```
Active Loadout (source of truth)
    ↓ getCurrentSetup()
├── Overview Page — renders active build dashboard
├── Tune Page — initializes with current racquet + strings
├── Compare Page — uses active loadout as baseline
├── Optimize Page — suggests improvements from current setup
└── Racket Bible — syncs on entry via _compSyncWithActiveLoadout()
```

### Module Bridge Pattern

`src/main.js` acts as a bridge between ES modules and inline HTML handlers:

```javascript
// Expose all app exports to window for onclick="funcName()" patterns
Object.entries(App).forEach(([key, val]) => {
  if (typeof val === 'function' || typeof val === 'object') {
    window[key] = val;
  }
});
```

---

## Data Pipeline

### Source of Truth

- `pipeline/data/frames.json` — racquet database
- `pipeline/data/strings.json` — string database
- `data.js` — generated, **never edit directly**

### Adding New Equipment

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

### Validation Ranges (frames)

| Field | Warn Range | Error Range | Engine Norm |
|-------|-----------|-------------|-------------|
| stiffness | 50-80 | 0-120 | 55-72 |
| swingweight | 260-380 | 0-500 | 300-340 |
| strungWeight | 240-380 | 0-500 | 290-340 |
| headSize | 85-115 | 0-200 | 95-102 |

---

## Testing Strategy

### Canary Tests

5 regression tests guard against OBS drift on every export. Run with:
```bash
npm run canary          # Run tests
npm run canary:baseline # Update expected values (careful!)
```

**Zero tolerance for OBS drift** — if canaries fail, investigate before committing.

### Type Checking

```bash
npm run typecheck  # Must pass with zero errors
```

### Manual Testing Checklist

When modifying UI components:
- [ ] Test in both light and dark mode
- [ ] Verify text contrast is readable
- [ ] Check responsive breakpoints (mobile/desktop)
- [ ] Ensure buttons have hover states
- [ ] Test string hybrid mode toggle
- [ ] Verify frame injection preview updates correctly
- [ ] Test searchable select dropdowns

When modifying the engine (`src/engine/`):
- [ ] `npm run typecheck` — zero errors
- [ ] `npm run canary` — all 5 pass, 0.0 OBS diff
- [ ] No logic changes — types only

---

## Deployment Process

### GitHub Pages (Primary)

Pushes to `main` auto-deploy via GitHub Actions:

```bash
git push origin main
```

Check status: https://github.com/zaldytb/loadout-lab/actions

### Vercel (Mirror)

Also deploys to Vercel on every push: https://loadout-lab.vercel.app

### Pre-deployment Checklist

```bash
npm run typecheck   # Must pass
npm run canary      # Must pass
npm run build       # Must complete without errors
```

---

## Key Types Reference

### Loadout (Single Source of Truth)

```typescript
interface Loadout {
  id: string;
  name: string;
  frameId: string;
  stringId: string | null;
  isHybrid: boolean;
  mainsId: string | null;
  crossesId: string | null;
  mainsTension: number;
  crossesTension: number;
  gauge?: string | null;
  mainsGauge?: string | null;
  crossesGauge?: string | null;
  stats?: SetupStats;
  obs: number;
  identity?: string;
  source?: string;
  _dirty?: boolean;
}
```

### StringConfig (Discriminated Union)

```typescript
type StringConfig = HybridStringConfig | FullbedStringConfig;

interface HybridStringConfig {
  isHybrid: true;
  mains: StringData;
  crosses: StringData;
  mainsTension: number;
  crossesTension: number;
}

interface FullbedStringConfig {
  isHybrid: false;
  string: StringData;
  mainsTension: number;
  crossesTension: number;
}
```

### predictSetup Function

```typescript
function predictSetup(
  racquet: Racquet,
  stringConfig: StringConfig
): SetupStats
```

---

## Design System

**"Digicraft Brutalism"** — monochrome base with orange accent:

| Token | Color | Usage |
|-------|-------|-------|
| `dc-void` | #1A1A1A | Primary dark background |
| `dc-void-deep` | #141414 | Deeper black |
| `dc-void-lift` | #222222 | Elevated dark surfaces |
| `dc-storm` | #5E666C | Muted gray |
| `dc-storm-light` | #8A9199 | Lighter gray |
| `dc-platinum` | #DCDFE2 | Primary light text |
| `dc-platinum-dim` | #B0B5BA | Dimmed light |
| `dc-white` | #F0F2F4 | Off-white |
| `dc-accent` | #FF4500 | Orange accent |
| `dc-red` | #AF0000 | Red alert |

**Typography**: Inter (sans) + JetBrains Mono (mono)

---

## Common Pitfalls

1. **Tailwind CDN Limitations**: No JIT mode, all utilities must be in class strings at parse time
2. **Dark Mode Detection**: Requires `data-theme="dark"` on `<html>`, not body or class-based
3. **Color Contrast**: `dc-void` is near-black, `dc-platinum` is light gray — easy to mix up
4. **Engine Edits**: `src/engine/` is TypeScript strict — run `npm run typecheck` after any change
5. **State Sync**: When using `createSearchableSelect`, store the instance in `ssInstances`
6. **Data.js**: Never edit directly — always use the pipeline
7. **Swingweight spelling**: In data, it's `swingweight` (lowercase w), not `swingWeight`

---

## Resources

- **Live Site**: https://zaldytb.github.io/loadout-lab/
- **Repository**: http://local_proxy@127.0.0.1:38515/git/zaldytb/loadout-lab
- **GitHub Actions**: https://github.com/zaldytb/loadout-lab/actions
