# Getting Started with Loadout Lab

Loadout Lab is a physics-based tennis equipment analysis tool. Pick a racquet, string, and tension — the engine predicts how your setup will play across nine attributes: power, spin, control, comfort, feel, stability, forgiveness, launch, and maneuverability.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Running the App](#running-the-app)
3. [Using the App](#using-the-app)
4. [Adding a Racquet](#adding-a-racquet)
5. [Adding a String](#adding-a-string)
6. [Finalizing Changes](#finalizing-changes)

---

## Prerequisites

- **Node.js** v20 or later — needed for the data pipeline, `tsx`, and the optional desktop GUI
- **npm** — bundled with Node.js
- A modern browser (Chrome, Firefox, Safari, Edge)

Install Node.js dependencies once before using any pipeline commands:

```bash
npm install
```

---

## Running the App

The app is built with Vite. Use the dev server for local development:

```bash
npm run dev
```

Vite starts a local server (typically `http://localhost:5173`) and opens the browser automatically. Hot module replacement is active — changes to source files reload instantly.

---

## Using the App

Once open, use the tabs at the top to navigate between modes:

| Mode | What it does |
|------|-------------|
| **Overview** | Dashboard summary of your selected racquet + string + tension |
| **Tune** | Adjust tension live and see how scores shift |
| **Compare** | Side-by-side analysis of up to 3 different loadouts |
| **Optimize** | Answer a short quiz to get a personalized frame recommendation |
| **Bible** | Full compendium of all racquets with raw specs |
| **How It Works** | Explanation of the prediction model |

Your loadout is automatically saved in browser `localStorage`. Use the **Share** button to generate a URL you can copy and send to others — no account required.

---

## Adding a Racquet

A "racquet" in Loadout Lab is called a **frame**. Frames live in `pipeline/data/frames.json`. There are three ways to add one.

### Option 1 — Interactive CLI (easiest for one frame)

```bash
npm run ingest:frame
```

The script will walk you through each field with prompts and validation. Required fields are marked. When you finish, the frame is appended to `frames.json` automatically.

**Required fields you will be asked for:**

| Field | Example | Notes |
|-------|---------|-------|
| Name | `Wilson Pro Staff 97 v14` | First word becomes the brand |
| Year | `2023` | |
| Head size | `97` | sq inches |
| Strung weight | `315` | grams |
| Balance | `32.3` | cm from butt |
| Swingweight | `328` | kg·cm² |
| Stiffness (RA) | `63` | Racquet Diagnostic Center scale |
| Beam width | `21.5,21.5,21.5` | mm, comma-separated (tip, shaft, throat) |
| String pattern | `16x19` | mains × crosses |
| Tension range | `50,60` | min, max in lbs |

Optional fields (identity descriptors, notes, tech bonuses) are also prompted but can be skipped.

### Option 2 — Batch CSV Import (for multiple frames)

Prepare a `.csv` file with these columns in order:

```
id,name,year,headSize,strungWeight,balance,balancePts,swingweight,stiffness,
beamWidth,pattern,tensionRange,powerLevel,strokeStyle,swingSpeed,frameProfile,
identity,notes,aeroBonus,comfortTech,spinTech,genBonus
```

> **Tip:** Leave `id` blank — it will be auto-generated from the name.
>
> **Important:** `beamWidth` and `tensionRange` must be quoted in the CSV because they contain commas:
> ```
> "21.5,21.5,21.5"   ← beamWidth
> "50,60"            ← tensionRange
> ```

Run the import:

```bash
npx tsx pipeline/scripts/ingest.ts --type frame --csv path/to/your/frames.csv
```

For interactive prompts (no CSV), use `npm run ingest:frame` instead.

The script will print how many frames were added and skip any that already exist.

### Option 3 — Desktop GUI (no command line)

A point-and-click table editor is available for batch frame entry:

```bash
cd tools/frame-gui
npm install        # first time only
npm start
```

1. Click **Browse…** and select the repo root folder (the one containing `package.json`).
2. Click **+ Add Row** to add a frame, or **Load CSV…** to load an existing file.
3. Fill in the cells — required fields are highlighted.
4. Click **Import into Loadout Lab** to run the ingest script. Output appears in the log panel at the bottom.

The app remembers your repo root between sessions. See [`tools/frame-gui/README.md`](../tools/frame-gui/README.md) for full details.

> **Windows installer:** A standalone `FrameGuiSetup.exe` can be built with `npm run build:win` from `tools/frame-gui/` — no repo clone required for end users. Node.js must still be installed on their machine for the import features to work.

---

## Adding a String

Strings live in `pipeline/data/strings.json`. The interactive CLI is the recommended method.

### Option 1 — Interactive CLI (easiest)

```bash
npm run ingest:string
```

The script will prompt for each field. For `twScore` sub-fields, it can **estimate** values from the string's core physical properties (stiffness, tensionLoss, spinPotential) — useful when you don't have full TW Universe data.

**Required fields:**

| Field | Example | Notes |
|-------|---------|-------|
| Name | `Luxilon ALU Power 125` | |
| Gauge | `16L` | e.g. 15, 16, 16L, 17, 18 |
| Gauge number | `1.25` | mm diameter |
| Material | `Polyester` | Must be one of the 5 types below |
| Stiffness | `220` | Dynamic stiffness (lb/in) |
| Tension loss | `15` | % drop after 24h |
| Spin potential | `8.5` | Measured value |
| twScore fields | `42` each | Power, spin, comfort, control, feel, playabilityDuration, durability (0–100) |

**Valid materials:**

- `Polyester`
- `Co-Polyester (elastic)`
- `Multifilament`
- `Natural Gut`
- `Synthetic Gut`

### Option 2 — Batch CSV Import

Prepare a `.csv` file with these columns:

```
id,name,gauge,gaugeNum,material,stiffness,tensionLoss,spinPotential,
twScore.power,twScore.spin,twScore.comfort,twScore.control,
twScore.feel,twScore.playabilityDuration,twScore.durability,
shape,identity,notes
```

> **Tip:** Leave `id` blank — it will be auto-generated from the name.
>
> Any missing `twScore.*` field will be estimated automatically.

Run the import:

```bash
npx tsx pipeline/scripts/ingest.ts --type string --csv path/to/your/strings.csv
```

---

## Finalizing Changes

After adding any frame or string, regenerate `data.js` so the app picks up the new equipment:

```bash
npm run pipeline
```

This runs **validate** (schemas), then **export:verify** (regenerate `data.js` and run **canary** regression tests). If everything passes, run `npm run dev` or refresh your deployed build — new equipment appears in the selectors.

### Individual pipeline commands

| Command | What it does |
|---------|-------------|
| `npm run validate` | Check all JSON data against schemas |
| `npm run export` | Regenerate `data.js` from JSON |
| `npm run export:verify` | Regenerate + run canary regression tests |
| `npm run canary` | Run regression tests only |
| `npm run pipeline` | Full validate → export → verify |

> **Important:** `data.js` is a generated file — never edit it directly. Always edit the JSON source files in `pipeline/data/` and re-run the pipeline.

---

## Quick-Reference Cheat Sheet

```bash
# Run the app (dev server)
npm run dev

# Add a racquet (interactive)
npm run ingest:frame

# Add a string (interactive)
npm run ingest:string

# Add racquets from CSV
npx tsx pipeline/scripts/ingest.ts --type frame --csv my-frames.csv

# Add strings from CSV
npx tsx pipeline/scripts/ingest.ts --type string --csv my-strings.csv

# Desktop GUI for frames (no CLI)
cd tools/frame-gui && npm install && npm start

# Rebuild data.js after any changes
npm run pipeline
```
