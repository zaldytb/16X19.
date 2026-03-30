# Frame GUI

A lightweight Electron desktop app for batch-importing tennis frames into Loadout Lab without using the CLI directly.

## Prerequisites

- Node.js ≥ 20
- The `loadout-lab` repository cloned locally

## Install

```bash
cd tools/frame-gui
npm install
```

## Start

```bash
npm start
```

## First run

On first launch, click **Browse…** in the top bar and select the root folder of your `loadout-lab` repository. This setting is remembered across sessions.

## Usage

| Action | How |
|--------|-----|
| Add a frame row | Click **Add Row** |
| Duplicate the selected row | Select a row (click its number), then click **Duplicate** |
| Delete the selected row | Select a row, then click **Delete Row** |
| Clear all rows | Click **Clear All** |
| Load an existing CSV | Click **Load CSV** and pick a file |
| Save rows to CSV only | Click **Save CSV** → writes `pipeline/import/frames-batch.csv` |
| Import into Loadout Lab | Click **Import into Loadout Lab** → saves `pipeline/import/frames-gui.csv` and runs the ingest script |
| Also regenerate generated app data | Tick **Also run pipeline after import** before clicking Import |

## Column reference

Required columns are shown in white; optional columns in grey.

| Column | Type | Notes |
|--------|------|-------|
| id | string | kebab-case, e.g. `babolat-pure-aero-2023` |
| name | string | Full name; first word becomes the brand automatically |
| year | integer | Release year |
| headSize | number | Square inches |
| strungWeight | number | Grams |
| balance | number | cm from butt end |
| balancePts | string | Optional, e.g. `4 pts HL` |
| swingweight | number | kg·cm² |
| stiffness | number | RA rating |
| beamWidth | string | One or three numbers separated by commas, e.g. `23` or `23,26,23` |
| pattern | string | Format `16x19` |
| tensionRange | string | Two numbers separated by a comma, e.g. `50,59` |
| powerLevel | string | Optional, e.g. `Medium` |
| strokeStyle | string | Optional, e.g. `Medium-Full` |
| swingSpeed | string | Optional, e.g. `Medium-Fast` |
| frameProfile | string | Optional free text |
| identity | string | Optional tag, e.g. `Spin Cannon` |
| notes | string | Optional free text |
| aeroBonus | number | `_meta` tech bonus (default 0) |
| comfortTech | number | `_meta` tech bonus (default 0) |
| spinTech | number | `_meta` tech bonus (default 0) |
| genBonus | number | `_meta` tech bonus (default 0) |

## Building the installer

### Prerequisites

- Node.js ≥ 20 on the **build machine**
- Windows (for a native `.exe`; cross-compiling from macOS/Linux requires Wine)

### Steps

```bash
cd tools/frame-gui
npm install          # installs Electron + electron-builder + TypeScript
npm run build:win    # produces dist/FrameGuiSetup.exe
```

The installer is written to `tools/frame-gui/dist/`. Distribute `FrameGuiSetup.exe` to users.

### Custom icon (optional)

Place a 256×256 `icon.ico` at `tools/frame-gui/build/icon.ico` before running the build. electron-builder will pick it up automatically. Without it, the default Electron icon is used.

### Runtime requirement for end users

The installer bundles Electron but **not** Node.js. Users must have [Node.js](https://nodejs.org) installed to use the Import and Run Pipeline features. The app shows a clear error dialog on launch if Node.js is missing.

---

## Contract

**The GUI never edits `frames.json`, `src/data/generated.ts`, or `data.ts` directly.**

All data writes go through the existing ingest pipeline:

1. The GUI writes a CSV to `pipeline/import/` inside the repo root.
2. It spawns `tsx` on `pipeline/scripts/ingest.ts` with `--type frame --csv <path>`, which validates every row against `pipeline/schemas/frame.schema.json` before appending to `pipeline/data/frames.json`.
3. Optionally it then runs `npm run pipeline` (validate + export) to regenerate `src/data/generated.ts` and compatibility `data.ts`.

This means all existing validation, duplicate detection, and provenance tracking still apply.
