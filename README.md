# Loadout Lab

A physics-based tennis equipment analysis tool. Pick a racquet, string, and tension — the engine predicts how your setup will play across nine attributes (power, spin, control, comfort, feel, stability, forgiveness, launch, maneuverability).

## Running the app

No build step required. Open `index.html` directly in any modern browser:

```
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows
```

Or serve locally with any static file server:

```
npx serve .
python3 -m http.server 8080
```

## Modes

| Mode | Description |
|------|-------------|
| Overview | Dashboard summary of the active loadout |
| Tune | Adjust tension and see live score deltas |
| Compare | Side-by-side analysis of up to 3 loadouts |
| Optimize | Frame recommendation engine (Find My Build quiz) |
| Bible | Full racquet compendium with raw specs |
| How It Works | In-app explanation of the prediction model |

## Project structure

```
index.html   — app shell and static layout (1,200 lines)
app.js       — all data and logic (≈13,000 lines)
style.css    — design system and component styles (≈8,000 lines)
```

No framework, no bundler, no dependencies beyond Chart.js (CDN) and Google Fonts.

## Data layer (`app.js`)

| Constant | Contents |
|----------|----------|
| `RACQUETS[]` | 60+ racquet specs: stiffness, beam, swingweight, pattern, balance, weight |
| `STRINGS[]` | 100+ string specs: TWU scores, stiffness, tensionLoss, spinPotential, gauge |
| `FRAME_META{}` | Per-frame technology bonuses (aero, comfortTech, spinTech, genBonus) not captured by raw specs |

## Prediction engine (`app.js`)

The engine is a four-layer pipeline called via `predictSetup(racquet, stringConfig)`:

```
Layer 0 — calcFrameBase(racquet)
  Normalizes raw specs → [0,1], computes 9 attribute scores via
  weighted linear models, enforces tradeoff ceilings, compresses to 50–85.

Layer 1 — calcBaseStringProfile(stringData)
  Derives standalone string scores from TWU-measured stiffness,
  tensionLoss, and spinPotential. No frame interaction yet.

  calcStringFrameMod(stringData)
  String × frame interaction modifiers (material affinity, stiffness pairing).

Layer 2 — calcTensionModifier(mainsTension, crossesTension, tensionRange, pattern)
  Pattern-aware tension overlay. Open beds (≤18 crosses) reward
  mains-tighter differentials; dense beds (≥20 crosses) prefer near-equal.
  Absolute level shifts power ↔ control ~2pts per 2 lbs from midpoint.

Layer 3 — calcHybridInteraction(mains, crosses)   [hybrid setups only]
  Pairing-specific bonuses/penalties for gut×poly, multi×poly, etc.
```

Final scores are blended and clamped to [0, 100] before display.

## Loadout persistence

Loadouts are stored in `localStorage`. The Share button encodes the active
loadout into a URL query string (`?build=…`) for easy sharing without a backend.

## Data Pipeline

Equipment data (racquets, strings) lives in `pipeline/data/` as JSON files. The browser loads `data.js` which is generated from these JSON files.

### Adding new equipment

```bash
# Add a frame interactively
npm run ingest:frame

# Add a string interactively (supports twScore estimation)
npm run ingest:string

# Batch import strings from CSV
node pipeline/scripts/ingest.js --type string --csv path/to/file.csv

# Batch import frames from CSV
node pipeline/scripts/ingest.js --type frame --csv path/to/frames.csv
```

### Pipeline commands

| Command | Description |
|---------|-------------|
| `npm run validate` | Check all data against schemas |
| `npm run export` | Regenerate data.js from JSON |
| `npm run export:verify` | Regenerate + run canary tests |
| `npm run canary` | Run 5 regression canaries |
| `npm run canary:baseline` | Re-record canary expected values |
| `npm run estimate` | Show estimation accuracy stats |
| `npm run pipeline` | Full validate + export + verify |

### File structure

```
pipeline/
  data/
    frames.json        ← 129 racquets (source of truth)
    strings.json       ← 52 strings (source of truth)
    canaries.json      ← regression test definitions
  schemas/
    frame.schema.json  ← validation schema for frames
    string.schema.json ← validation schema for strings
  scripts/
    extract.js         ← one-time: extract data from app.js
    validate.js        ← schema + range validation
    estimate.js        ← string property estimation
    ingest.js          ← add new entries (interactive/CSV)
    canary-test.js     ← regression canary runner
    export-to-app.js   ← JSON → data.js generator
  engine/
    core.js            ← portable engine (22 functions, Node.js)
```

### Key principle

`pipeline/data/*.json` is the source of truth. `data.js` is generated — never edit it directly. `app.js` contains only engine + UI — no equipment data.
