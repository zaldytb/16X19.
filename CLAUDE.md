# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Tennis Loadout Lab ("16X19") is a physics-based tennis equipment prediction engine. Users select racquets, strings, and tensions to get performance predictions across 11 attributes. It's a static SPA deployed to GitHub Pages (primary) and Vercel (mirror).

**Stack:** Vite 8, TypeScript 6 (strict), React 19, Zustand 5, Tailwind CSS 4, Chart.js. Pipeline scripts run with `tsx` on Node 20+.

---

## Commands

```bash
# Development
npm run dev          # Start Vite dev server
npm run build        # Production build -> dist/
npm run preview      # Preview production build

# Validation (run before every commit)
npm run typecheck    # TypeScript check -- must be zero errors
npm run canary       # regression canaries (OBS + frame novelty profile + archetype) -- refresh baselines after intentional scoring changes
npm run test:runtime # Runtime hardening tests (refresh plans, DOM contracts)

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

Pipeline scripts live in `pipeline/scripts/*.ts` and run with **`tsx`** (TypeScript execution).

**Pre-commit checklist:** `npm run typecheck && npm run canary && npm run build && npm run test:runtime`

---

## Architecture

### Startup and module wiring

TypeScript owns all live UI and engine code under `src/`. [`src/main.tsx`](src/main.tsx) is the Vite entry -- it mounts the React app and initializes startup helpers such as the favicon heartbeat. [`src/App.tsx`](src/App.tsx) mounts the shell and calls [`src/bridge/installWindowBridge.ts`](src/bridge/installWindowBridge.ts) for the Digicraft boot sequence plus vanilla shell/bootstrap wiring. There is no root `app.js` monolith.

Cross-module behavior now prefers direct imports, delegated listeners, or explicit callback registries. Do not add new `window.*` globals as part of normal feature work.

React Router routes live in `src/App.tsx`, with route wrappers in `src/pages/` and shell UI in `src/components/shell/`. Workspace **orchestration** still lives in `src/ui/pages/*.ts` (e.g. `tune.ts`, `overview.ts`, `compare/`). The **Tune** workspace mounts declarative UI from **`src/components/tune/`** into placeholder DOM from `src/pages/Tune.tsx` via `createRoot` in `tune.ts`, using pure view-models (`tune-*-vm.ts`, shared helpers) and **`_ensureTuneReactRoot`** so roots survive lazy-route unmount. See **`docs/REACT-MIGRATION-PLAN.md`** (roadmap) and **`docs/REACT-MIGRATION-GUIDE.md`** (Zero-Pixel Protocol).

### Runtime coordination (`src/runtime/`)

`src/runtime/coordinator.ts` is the refresh coordinator for route changes and shared state changes. It computes **`getRefreshPlan(mode, changed)`** (includes **`compendium`** when the shell mode is compendium and loadout/mode changed) and calls callback registries such as `src/ui/pages/overview-runtime-bridge.ts`, `src/ui/pages/tune-runtime-bridge.ts`, and `src/ui/pages/compare-runtime-bridge.ts`.

Treat those `*-runtime-bridge.ts` files as internal callback registries for lazy page modules, not as a revival of the old `window.*` bridge.

### State management (`src/state/`)

Centralized single-source-of-truth store:

- `useAppStore.ts` -- backing Zustand store for loadout + app state
- `store.ts` -- active/saved loadout facade used by runtime and non-React code; setting the active loadout also persists it
- `loadout.ts` -- saved-loadout CRUD operations and saved-list localStorage persistence
- `active-loadout-storage.ts` -- active-loadout localStorage helpers used for refresh-safe restore
- `setup-sync.ts` -- `getCurrentSetup()`, cross-page state synchronization
- `app-state.ts` -- mode, compare slots, radar/slot colors, dock editor context facade
- `presets.ts` -- top builds generation

All pages derive their initial state from `getCurrentSetup()`. The active loadout is the canonical source. Prefer the `store.ts` / `app-state.ts` facades for runtime code; use Zustand hooks/selectors only where React ownership is helpful.

On boot, `src/ui/pages/shell.ts` hydrates saved loadouts and then restores the active loadout from local storage. Refresh persistence is therefore part of the expected runtime contract.

### Data layer

- `pipeline/data/frames.json` -- racquet database (source of truth, never edit generated outputs directly)
- `pipeline/data/strings.json` -- string database (source of truth)
- `src/data/generated.ts` -- **generated app data module** from `npm run export`; commit after regenerating
- `data.ts` -- **generated compatibility module** from `npm run export`; commit after regenerating
- `pipeline/schemas/` -- JSON schemas used by `npm run validate`
- `src/data/loader.ts` -- imports `RACQUETS`, `STRINGS`, `FRAME_META`, `FRAME_NOVELTY_PROFILE` from `src/data/generated.ts`

### UI pages (`src/ui/pages/`)

Imperative page modules include `shell.ts`, `overview.ts`, `tune.ts`, `compare/`, `optimize.ts`, `compendium.ts`, `strings.ts`, `find-my-build.ts`, `my-loadouts.ts`, and `leaderboard.ts`. React route wrappers live separately under `src/pages/`.

**Tune** — `tune.ts` drives sweep, slider, and recommendations; **React** components under `src/components/tune/` (OBS, delta, WTTN, gauge explorer, recs, sweep chart, slider adornments, etc.) are mounted into `Tune.tsx` hosts. Chart.js for the sweep uses the global `Chart` from `index.html` inside `tune-sweep-chart.ts`, with `TuneSweepChart.tsx` owning canvas lifecycle.

The live Find My Build flow is the imperative `find-my-build.ts` module opened from Overview and dock actions, not a standalone routed workspace.

### Further React migration

After Tune, other workspaces should follow the same **Strangler Fig** pattern: one widget at a time, `createRoot` in the legacy module, dumb components + pure VMs, no visual drift — see **`docs/REACT-MIGRATION-GUIDE.md`** and **`docs/REACT-MIGRATION-PLAN.md`**.

---

## Frame ingestion pipeline

Frames enter the system through `pipeline/scripts/ingest.ts` and flow through validation, storage, and export before the engine can use them.

### Entry points

| Method | Command |
| ------ | ------- |
| Interactive CLI | `npm run ingest:frame` |
| Batch CSV | `npx tsx pipeline/scripts/ingest.ts --type frame --csv path/to.csv` |
| Browser table | `tools/frame-editor.html` -- download CSV, then run ingest |
| Electron GUI | `tools/frame-gui/` -- table UI that spawns the same ingest script |

### Required fields (schema: `pipeline/schemas/frame.schema.json`)

| Field | Type | Description |
| ----- | ---- | ----------- |
| `id` | string | Kebab-case unique identifier (`^[a-z0-9-]+$`) |
| `name` | string | Full racquet name (e.g. "Babolat Pure Aero 100 318g") |
| `year` | integer | Year of release |
| `headSize` | number | Head size in sq inches |
| `strungWeight` | number | Strung weight in grams |
| `swingweight` | number | Swingweight in kg-cm2 (**lowercase 'w'**) |
| `stiffness` | number | RA stiffness rating |
| `beamWidth` | number[] | Beam width profile in mm (1-3 values) |
| `pattern` | string | String pattern e.g. "16x19" (`^\d+x\d+$`) |
| `tensionRange` | [number, number] | [low, high] in lbs |
| `balance` | number | Balance point in cm from butt |

Optional fields: `balancePts`, `length`, `powerLevel`, `strokeStyle`, `swingSpeed`, `frameProfile`, `identity`, `notes`.

### Pipeline-only fields (stored in frames.json, stripped on export)

**`_meta`** -- technology bonuses consumed by the engine via `FRAME_META`:

| Field | Effect | Scale |
| ----- | ------ | ----- |
| `aeroBonus` | Aerodynamic benefit -> power, spin | 0 = none, 2+ = exceptional |
| `comfortTech` | Vibration dampening -> comfort, feel | 0 = none, 2+ = exceptional |
| `spinTech` | Textured/open-throat tech -> spin | 0 = none, 2+ = exceptional |
| `genBonus` | Generation improvement -> small boost across attrs | 0 = none |

**`_provenance`** -- data lineage (`source`, `dateAdded`, `confidence`, `estimatedFields`).

**`brand`** -- auto-derived from the first word of `name`.

### Validation ranges (from schema `_validationRanges`)

| Field | Engine norm range | Warn range | Error range |
| ----- | ----------------- | ---------- | ----------- |
| `stiffness` | 55 -- 72 | 50 -- 80 | 0 -- 120 |
| `swingweight` | 300 -- 340 | 260 -- 380 | 0 -- 500 |
| `strungWeight` | 290 -- 340 | 240 -- 380 | 0 -- 500 |
| `headSize` | 95 -- 102 | 85 -- 115 | 0 -- 200 |
| `beamWidth` (each) | 18 -- 27 | 14 -- 32 | 0 -- 50 |

Values outside **engine norm** lose discrimination (clamped to 0 or 1 in normalization).

### Export flow

`npm run export` runs `pipeline/scripts/export-to-app.ts`:

1. Strips `_provenance`, `_meta`, `_novelty`, `brand`, `_staging` from each frame
2. Extracts `_meta` into `FRAME_META` and folds `_novelty` + catalog rarity into `FRAME_NOVELTY_PROFILE`
3. Writes `RACQUETS[]`, `STRINGS[]`, `FRAME_META{}`, `FRAME_NOVELTY_PROFILE{}` to `src/data/generated.ts`
4. Writes root `data.ts` compatibility re-export

---

## Prediction engine -- complete scoring reference

Pure TypeScript functions in `src/engine/` -- deterministic, no side effects. Same inputs always produce identical outputs. The engine computes 11 attribute scores, a composite OBS score (0-100), and an identity archetype.

### End-to-end flow

```text
Raw frame specs + string TWU data + tension + gauge
  |
  v
[L0] calcFrameBase()           -> 11 frame base scores
     frame novelty pass        -> contradiction-based frame stat adjustments
[L1] calcBaseStringProfile()   -> 7 string profile scores
     applyGaugeModifier()      -> adjusted string properties (if non-reference gauge)
[L2] calcStringFrameMod()      -> 6 string-frame interaction deltas
     calcTensionModifier()     -> 8 tension deltas (pattern-aware)
[L3] calcHybridInteraction()   -> 8 hybrid pairing deltas (hybrid only)
  |
  v
[Final] predictSetup()         -> weighted blend: frame 72% + string 28%
        computeCompositeScore() -> OBS 0-100 (weighted avg + tension penalties)
        generateIdentity()      -> archetype + description + tags
```

### L0: Frame base scores (`frame-physics.ts`)

#### Input normalization

All raw specs are normalized to [0, 1] via `norm(val, min, max)`:

| Input | Source field | Min | Max | Direction |
| ----- | ----------- | --- | --- | --------- |
| raNorm | `stiffness` | 55 | 72 | 0=soft, 1=stiff |
| swNorm | `swingweight` | 300 | 340 | 0=light, 1=heavy |
| wtNorm | `strungWeight` | 290 | 340 | 0=light, 1=heavy |
| hsNorm | `headSize` | 95 | 102 | 0=small, 1=large |
| avgBeamNorm | avg(beamWidth) | 18 | 27 | 0=thin, 1=thick |
| maxBeamNorm | max(beamWidth) | 18 | 27 | 0=thin, 1=thick |
| hlNorm | balance -> HL pts | 0 | 8 | 0=even, 1=very HL |
| densityNorm | mains x crosses | 288 | 360 | 0=open, 1=dense |
| beamVarNorm | max-min beam | 0 | 8 | 0=constant, 1=variable |

Derived: `openness = 1 - densityNorm`, `balancePtsHL = (34.29 - balance) / 0.3175`.

#### 11 attribute formulas

Each starts at a base value (50, except forgiveness at 48), then adds weighted contributions from normalized inputs and `_meta` technology bonuses.

**Power** (base 50): `+raNorm*18-5`, `+maxBeamNorm*14-4`, `+swNorm*8-2`, `+openness*4-2`, `+beamVarNorm*4`, `-hlNorm*3`, `+aeroBonus*1.5`, `+genBonus*1`

**Spin** (base 50): `+openness*18-6`, `+hsNorm*8-2`, `+beamVarNorm*4`, `+spinTech*3`, `+aeroBonus*2`, `+genBonus*0.5`

**Control** (base 50): `+densityNorm*14-4`, `+(1-hsNorm)*8-2`, `+swNorm*6-1.5`, `+(1-maxBeamNorm)*6-2`, `+hlNorm*3`, `+genBonus*0.5`, stiffness curve: `raNorm>0.3 ? (raNorm-0.3)*4 : (raNorm-0.3)*6`

**Launch** (base 50): `+beamVarNorm*10`, `+(1-raNorm)*8-3`, `+openness*5-2`, `+maxBeamNorm*4-1.5`, `+spinTech*1.5`

**Comfort** (base 50): `+(1-raNorm)*20-5`, `+(1-avgBeamNorm)*5-1`, `+comfortTech*3`, `+genBonus*1`, penalty if `wtNorm>0.7`: `-(wtNorm-0.7)*8`

**Stability** (base 50): `+swNorm*20-6`, `+wtNorm*10-3`, `+raNorm*5-1.5`, `-hlNorm*4`, `+genBonus*0.5`

**Forgiveness** (base 48): `+hsNorm*24-8`, `+swNorm*10-4`, `+beamVarNorm*5`, `+avgBeamNorm*7-2.5`, `+comfortTech*1.5`, `+(1-raNorm)*6-2`, `+wtNorm*5-2`

**Feel** (base 50): `+(1-raNorm)*20-6`, `+(1-avgBeamNorm)*10-3`, `+hlNorm*4`, `+wtNorm*4-1`, `+genBonus*1.5`, `+densityNorm*4-2`, comfortTech capped: `comfortTech>1.5 ? -1 : comfortTech*0.5`

**Maneuverability** (base 50): `+(1-swNorm)*22-6`, `+hlNorm*10-3`, `+(1-wtNorm)*8-2`, `+(1-hsNorm)*4-1`. Interaction bonus: if `hlNorm>0.5 && swNorm<0.4` -> `+(hlNorm-0.5)*(0.4-swNorm)*12`. Crush penalty: if `swNorm>0.75` -> `-(swNorm-0.75)*16`.

**Durability** (base 50): `+maxBeamNorm*15-5`, `+raNorm*10-3`, `+densityNorm*8-2`, `+genBonus*0.5`

**Playability** (base 50): `+(1-raNorm)*12-4`, `+comfortTech*2`, `+genBonus*0.5`

#### Tradeoff enforcement (string layer)

Three natural physics-based ceilings are soft-enforced (excess taxed from the higher attribute):

| Pair | Cap | Tax rate |
| ---- | --- | -------- |
| Power + Control | 145 | 40% of excess |
| Power + Comfort | 140 | 30% (stiff frames lose comfort, soft lose power) |
| Maneuverability + Stability | 140 | 30% of excess |

#### Score compression

```text
compress(val, spread=0.85) = clamp(62 + (val - 62) * spread, 30, 90)
```

Forgiveness uses `spread=0.92` (wider range for its narrower natural variance). Final `clamp(0, 100)` applied after rounding.

### L0.5: Frame contradiction modeling (`composite.ts`)

After `calcFrameBase()`, the engine applies a small frame-stage contradiction pass before strings are blended in.

Inputs:

- frame-base outcomes from `calcFrameBase()`
- raw frame specs (`headSize`, `pattern`, `beamWidth`, `swingweight`, `stiffness`, etc.)
- `FRAME_NOVELTY_PROFILE` (bucket rarity + percentile context)
- reviewer-authored `_novelty` hints exported into `FRAME_NOVELTY_PROFILE.hintWeights`

The pass produces a small attribute boost map rather than a user-facing novelty number. Those boosts are then included in the normal frame/string blend, so the user reads the contradiction from the final stat shape and OBS.

---

### L1: String profile scores (`string-profile.ts`)

#### Input normalization

| Property | Source | Range | Direction |
| -------- | ------ | ----- | --------- |
| stiffNorm | `stiffness` (lb/in) | 115 -- 234 | **inverted**: 0=stiffest, 1=softest |
| tLossNorm | `tensionLoss` (%) | 10 -- 50 | 0=best, 1=worst |
| spinNorm | `spinPotential` | 4.5 -- 9.0 | 0=low, 1=high |

#### TWU score compression

```text
compressScore(raw) = clamp(65 + (raw - 65) * 0.55, 30, 95)
```

Raw TWU scores (~38-98) compress to ~32-88, pulling extremes toward the 65 midpoint.

#### 7 attribute formulas

**Power**: `compress(tw.power) + stiffNorm*5-2` (soft: +3, stiff: -2)

**Control**: `compress(tw.control) + (1-stiffNorm)*4-1.5` (stiff: +2.5, soft: -1.5)

**Spin**: `compress(tw.spin)*0.6 + compress(spinPotential*12)*0.4` (blends lab score with friction)

**Comfort**: `compress(tw.comfort) + stiffNorm*4-1.5`

**Feel**: `compress(tw.feel) + stiffNorm*4-1`. Gut bonus: +3. Shaped non-gut penalty: -1.5.

**Durability**: `compress(tw.durability)`. Thin gauge (<=1.20): -3. Thick gauge (>=1.30): +2.

**Playability**: `compress(tw.playabilityDuration) + (1-tLossNorm)*6-2` (good maintenance: +4)

#### Tradeoff enforcement

| Pair | Cap | Tax rate |
| ---- | --- | -------- |
| Power + Control | 140 | 50% of excess |
| Comfort + Control | 145 | 40% of excess |

Final clamp: all attributes to **[25, 86]**.

---

### Gauge modifier (`string-profile.ts:applyGaugeModifier`)

Creates a modified copy of `StringData` when the user selects a non-reference gauge. Each 0.05mm step (thicker = positive):

| Property | Change per step |
| -------- | --------------- |
| Stiffness | +6% multiplier |
| Tension loss | +4% multiplier |
| Spin potential | -0.15 |
| tw.power | -2 |
| tw.comfort | -1.5 |
| tw.feel | -2 |
| tw.control | +1.5 |
| tw.durability | +3 |
| tw.spin | -1 |
| tw.playabilityDuration | -0.5 |

---

### L2a: String-frame interaction (`string-profile.ts:calcStringFrameMod`)

Small deltas (-3 to +5 range) from string stiffness interacting with the frame:

| Mod | Formula | Soft -> Stiff |
| --- | ------- | ------------- |
| powerMod | `stiffNorm*3-1` | +2 -> -1 |
| spinMod | `(spinPotential-6.0)*1.5` | centered at 6.0 |
| controlMod | `(1-stiffNorm)*3-1` | -1 -> +2 |
| comfortMod | `stiffNorm*3-1` | +2 -> -1 |
| feelMod | `stiffNorm*2.5-0.5` | +2 -> -0.5 |
| launchMod | `stiffNorm*1.5-0.4` | +1.1 -> -0.4 |

---

### L2b: Tension modifier (`tension.ts:calcTensionModifier`)

#### Level effect (average tension vs frame midpoint)

Every 2 lbs above midpoint (`factor = (avgTension - mid) / 2`):

| Mod | Formula |
| --- | ------- |
| powerMod | `-factor*2` |
| controlMod | `+factor*2` |
| launchMod | `-factor*1.5` |
| comfortMod | `-factor*1.5` |
| spinMod | `-abs(factor)*0.4` |
| feelMod | `+factor*1.0` |
| playabilityMod | `-abs(factor)*0.6` |

#### Pattern-aware differential effect (mains tension - crosses tension)

The optimal mains/crosses differential depends on cross density:

**Open patterns** (<=18 crosses, e.g. 16x19): mains-tighter is optimal.

| Differential | Effect |
| ------------ | ------ |
| +1 to +4 | Spin bonus up to +3 (sweet spot) |
| +4 to +6 | Spin +1.5, control penalty starts |
| >+6 | Excessive: control, comfort, durability, feel penalties |
| <-1 | Crosses tighter kills snapback: spin penalty, feel drop |

**Dense 20-cross patterns** (>=20 crosses, e.g. 18x20): near-equal is optimal.

| Differential | Effect |
| ------------ | ------ |
| +/-2 | Sweet spot: control +0.5, feel +0.5 |
| -1 to -3 | Crosses slightly tighter: valid, control +1, spin -0.5 |
| +3 to +4 | Mains slightly tighter: diminishing returns |
| >+4 | BAD: spin, control, comfort, feel, durability all penalized |
| <-3 | Excessive: control, comfort, feel penalties |

**Standard patterns** (e.g. 18x19): middle ground between open and dense.

---

### L3: Hybrid interaction (`hybrid.ts:calcHybridInteraction`)

Evaluates material pairings for hybrid setups. Five cases:

| Case | Mains | Crosses | Key effects |
| ---- | ----- | ------- | ----------- |
| 1 | Gut/Multi | Poly | comfort+1, control+2, durability-3. Round/slick cross: durability+3, feel+1. Shaped cross: durability-5, feel-2. |
| 2 | Poly | Poly | Shaped mains: spin+1.5, control+0.5. Round/slick cross: spin+1.5, control+1. Both shaped: spin-2, feel-1. Stiff gap>60: feel-1. |
| 3 | Poly | Gut/Multi/Synth | feel+1.5, comfort+1, power+0.5. Gut cross: durability-5, playability-2. Shaped mains + gut cross: durability-3. |
| 4 | Gut | Gut | feel+3, comfort+2, power+1, durability-6, control-2, spin-2 |
| 5 | Soft (non-gut) | Soft (non-gut) | comfort+1, durability-1, control-1 |

---

### Final: Composite prediction (`composite.ts:predictSetup`)

#### Frame/string blend weights

| Weight | Value | Purpose |
| ------ | ----- | ------- |
| FW (frame weight) | **0.72** | Frame drives most attributes |
| SW (string weight) | **0.28** | String profile modulates |

#### Final attribute calculation

```text
stat = frameBase * 0.72 + stringProfile * 0.28 + stringFrameMod + tensionMod
```

**Exceptions** -- some attributes are single-source:

| Attribute | Source | Note |
| --------- | ------ | ---- |
| Stability | Frame only | `frameBase.stability` |
| Forgiveness | Frame only | `frameBase.forgiveness` |
| Maneuverability | Frame only | `frameBase.maneuverability` |
| Launch | Frame + mods only | `frameBase.launch + stringMod.launchMod + tensionMod.launchMod` |
| Durability | String + tension | `stringProfile.durability + tensionMod.durabilityMod` |
| Playability | String + tension | `stringProfile.playability + tensionMod.playabilityMod` |

#### Hybrid blending

For hybrid setups, string contributions are weighted before entering the formula:

**String-frame mods** (6 deltas): mains 70% + crosses 30% for power/spin/comfort/feel/launch; *inverted* for control (mains 30% + crosses 70%). Hybrid interaction deltas added on top.

**String profile** (7 scores): mains-weighted for power/feel/comfort (70/30), spin (60/40), playability (60/40); crosses-weighted for control (40/60), durability (40/60).

---

### OBS: Overall Build Score (`composite.ts:computeCompositeScore`)

#### Attribute weights

| Attribute | Weight | Priority |
| --------- | ------ | -------- |
| Control | 0.16 | Highest |
| Spin | 0.13 | |
| Comfort | 0.13 | |
| Power | 0.11 | |
| Feel | 0.10 | |
| Maneuverability | 0.09 | |
| Stability | 0.07 | |
| Forgiveness | 0.07 | |
| Playability | 0.06 | |
| Launch | 0.04 | |
| Durability | 0.04 | Lowest |

#### Scaling

```text
raw = weighted sum of all 11 attributes
scaled = 22 + (raw - 58) * 8.5
```

#### Frame-stage contradiction modeling

Novelty is no longer a separate OBS add-on. Instead, the engine applies a small frame-stage contradiction adjustment **after** `calcFrameBase()` and **before** string blending.

That contradiction pass combines:

1. **Outcome contradiction archetypes** from the frame base itself:
   - `controlBomber`: power + control + spin
   - `plushLauncher`: power + comfort + forgiveness
   - `stableWhipper`: stability + maneuverability + spin
   - `preciseSpinner`: control + spin/launch
   - `comfortableAttacker`: comfort + put-away power + feel/control
2. **Spec contradiction checks**:
   - denser pattern but still standout spin
   - firmer/thicker power platform but still strong comfort
   - heavier / more stable platform that still preserves whip speed
3. **Rarity amplification** from build-time `FRAME_NOVELTY_PROFILE`
4. **Reviewer-authored `_novelty` hints** in `frames.json`, exported into `FRAME_NOVELTY_PROFILE.hintWeights`

The result is a small attribute boost map applied to frame stats before strings/tension are blended in. Users infer the contradiction from the final stat shape and OBS; novelty itself stays an internal modeling tool.

#### Tension sanity penalties

**Out-of-range** (from racquet's tensionRange [low, high]):

| Condition | Penalty |
| --------- | ------- |
| Below low | deficit * 1.5 |
| Below low-8 (severe) | deficit * 3, max 90 |
| Above high | excess * 1.2 |
| Above high+8 (severe) | excess * 2.5, max 80 |

**Mains/crosses differential**:

| Condition | Penalty |
| --------- | ------- |
| abs(diff) > 10 (extreme) | 12 + (excess * 5) |
| Mains too tight (open: >6, dense: >4) | `excess * 3` (open) or `excess * 4` (dense) |
| Crosses too tight (open: >4) | excess * 3 |
| Crosses too tight (dense: >6) | excess * 2.5 |

#### OBS tier mapping

| Score | Tier label |
| ----- | ---------- |
| 0-10 | Delete This |
| 10-20 | Hospital Build |
| 20-30 | Bruh |
| 30-40 | Cooked |
| 40-50 | This Ain't It |
| 50-60 | Mid |
| 60-70 | Built Diff |
| 70-80 | S Rank |
| 80-90 | WTF |
| 90-100 | Max Aura |

---

### Identity and archetype (`composite.ts:generateIdentity`)

17 archetypes scored from setup attributes. Highest valid score wins; fallback is "Balanced Setup".

| Archetype | Requirements |
| --------- | ------------ |
| Precision Topspin Blade | spin>=78, control>=82, power<60 |
| Surgical Topspin Machine | spin>=75, control>=65, control<82 |
| Topspin Howitzer | spin>=78, power>=65, spin>=power |
| Power Spin Hybrid | spin>=75, power>=70, power>spin |
| Spin Dominator | spin>=75, power<65, control<82 |
| Power Brawler | power>=75, control<=65 |
| Power Hybrid | power>=65, power<80, spin<78, control>55 |
| Precision Instrument | control>=82, spin<78 |
| Control Platform | control>=70, control<82, spin<75 |
| Comfort Cannon | comfort>=72, power>=65 |
| Touch Artist | feel>=75, control>=70, power<65 |
| Wall of Stability | stability>=70, control>=70 |
| Forgiving Weapon | forgiveness>=68, power>=60 |
| Whip Master | maneuverability>=72, spin>=68 |
| Speed Demon | maneuverability>=75, power>=55, stability<60 |
| Endurance Build | playability>=88, durability>=80 |
| Marathon Setup | durability>=85, playability>=82 |

**Tags** (max 4 per setup): High Spin (>=75), Power (>=70), Precision (control>=75), Arm-Friendly (comfort>=72), Touch (feel>=72), Stable (stability>=70), Fast Swing (maneuverability>=72), Durable (durability>=78), Long-Lasting (playability>=82), Forgiving (forgiveness>=70).

---

## Critical rules

- **Never edit `src/data/generated.ts` or `data.ts` directly** -- both are generated. Modify `pipeline/data/frames.json` or `pipeline/data/strings.json`, then run `npm run pipeline`.
- **Swingweight spelling** -- field name in JSON data is `swingweight` (lowercase 'w'), not `swingWeight`.
- **TypeScript strict mode** -- `src/` (engine, state, UI) must pass `npm run typecheck` with zero errors.
- **Canary baselines must be refreshed after intentional scoring changes** -- `npm run canary` now checks OBS, frame novelty breakdown/archetypes, and identity expectations. If you intentionally change engine math, run `npm run canary:baseline` to re-record.
- **Tailwind setup is mixed on purpose** -- the app uses `@tailwindcss/vite`, and `index.html` still carries inline Tailwind config/runtime tokens. Treat both as load-bearing unless you are doing a dedicated styling audit.
- **Import paths end in `.js`** -- TypeScript files under `src/` use `.js` extensions in imports (bundler resolution to `.ts` sources). This is intentional.
- **Route aliasing** -- `pathToMode()` in `src/routing/modePaths.ts` intentionally aliases `/strings` and `/leaderboard` back to the Compendium shell mode so shared nav state stays coherent.
- **Stale client state** -- a "working" UI can show wrong numbers if store/setup-sync are out of date. When scores look off, verify the store and `getCurrentSetup()` first.
- **Persistence contract** -- active loadout and saved loadouts are expected to survive refresh via local storage. If a refresh loses the current build, inspect `src/state/active-loadout-storage.ts`, `src/state/store.ts`, and shell boot restore in `src/ui/pages/shell.ts`.
- **Tune page sensitivity** -- when changing Tune, verify together: delta card, OBS in Tune, WTTN, recommendations, loadout switching while Tune is open, slider -> apply, sweep chart annotations after theme toggle.
- **React migration (Zero-Pixel)** -- new workspace UI migrated from imperative TS must use the guide in `docs/REACT-MIGRATION-GUIDE.md`; do not change pixels or Tailwind output casually. Lazy routes require root invalidation (same idea as `_ensureTuneReactRoot`).

---

## Design system

"Digicraft Brutalism" -- monochrome + orange accent. Custom CSS in `style.css` (~8,600 lines).

Key tokens: `dc-void` (#1A1A1A), `dc-accent` (#FF4500), `dc-platinum` (#DCDFE2). Dark mode via `data-theme="dark"` on `<html>`. Fonts: Inter (sans) + JetBrains Mono.

---

## Deployment

Auto-deploys to GitHub Pages on push to `main` via `.github/workflows/deploy.yml`. Vercel mirrors the repo at `loadout-lab.vercel.app`. No manual deployment steps needed beyond pushing.
