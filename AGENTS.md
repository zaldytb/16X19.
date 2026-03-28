# Tennis Loadout Lab - Agent Documentation

## Project Overview

16X19, also referred to in older docs as Tennis Loadout Lab, is a
physics-based tennis equipment analysis tool. It predicts how a racquet and
string setup will perform across 11 attributes and summarizes the build with an
OBS composite score plus identity and archetype output.

Core user workflows:
- browse racquets in the Racket Bible
- browse strings in the String Compendium
- configure full-bed and hybrid builds
- tune tension with live feedback
- compare multiple setups
- generate optimized and recommended alternatives
- save, activate, duplicate, and share loadouts

Primary URL: `https://zaldytb.github.io/loadout-lab/`
Mirror: `https://loadout-lab.vercel.app`

## Technology Stack

| Category | Technology |
|----------|------------|
| Build Tool | Vite 8.x |
| Language | TypeScript 6.x plus legacy JavaScript |
| Styling | Tailwind CSS 4.x CDN plus custom CSS |
| Package Manager | npm |
| Runtime | Node.js 20+ |
| Charts | Chart.js via CDN |
| Deployment | GitHub Pages and Vercel |

## Current Migration Snapshot

The repo is in a mixed but much healthier state than the original monolith.

TypeScript currently owns the live bridge entrypoints for:
- shell and mode switching
- overview
- tune runtime
- compare
- optimize
- compendium
- strings

What still remains in `app.js`:
- duplicated legacy implementations and wrappers
- compatibility shims for inline handlers and older flows
- Tune recommendation content and some other still-unmigrated helper surfaces

Practical takeaway:
- prefer the extracted TypeScript modules first
- treat `app.js` as compatibility or fallback unless the runtime bridge still points there
- when debugging regressions, always verify the live `window.*` bridge path before fixing leaf code

## Project Structure

```text
loadout-lab/
|- index.html
|- app.js
|- style.css
|- data.js
|- README.md
|- AGENTS.md
|- ts-migration-plan.md
|- src/
|  |- main.js
|  |- engine/
|  |- state/
|  |  |- store.ts
|  |  |- loadout.ts
|  |  |- setup-sync.ts
|  |  |- app-state.ts
|  |  `- presets.ts
|  |- ui/
|  |  |- components/
|  |  |- pages/
|  |  |  |- overview.ts
|  |  |  |- tune.ts
|  |  |  |- compare.ts
|  |  |  |- optimize.ts
|  |  |  |- compendium.ts
|  |  |  |- strings.ts
|  |  |  |- find-my-build.ts
|  |  |  |- my-loadouts.ts
|  |  |  `- leaderboard.js
|  |  `- shared/
|  |- data/
|  `- utils/
|- pipeline/
|- tools/
`- .github/workflows/
```

## Important Runtime Ownership Rules

### 1. The live bridge matters more than duplicate code

`src/main.js` defines the actual public ownership of inline handlers and page
entrypoints. Always check what `window.*` points to before assuming `app.js` or
the TS module is the live implementation.

### 2. The active loadout is the source of truth

`src/state/store.ts` owns:
- active loadout
- saved loadouts

`src/state/setup-sync.ts` derives the current racquet and string configuration
from that stored loadout state.

### 3. Shared runtime UI state lives in `app-state.ts`

Use `src/state/app-state.ts` for:
- current mode
- compare slots and compare radar state
- shared runtime UI coordination

Do not create new parallel mutable globals in `app.js` unless absolutely needed
for temporary compatibility.

## Build and Verification Commands

### Development

```bash
npm run dev
npm run typecheck
```

### Production

```bash
npm run build
npm run preview
```

### Regression and Data

```bash
npm run canary
npm run validate
npm run export
npm run pipeline
```

## Data Pipeline

Source of truth:
- `pipeline/data/frames.json`
- `pipeline/data/strings.json`
- `pipeline/data/canaries.json`

Generated output:
- `data.js`

Never hand-edit `data.js`.

## Debugging Guidance

### Tune

Tune has been one of the most sensitive migration areas. When touching it,
verify these stay on one state system:
- delta card
- OBS card in Tune
- WTTN
- recommended builds
- loadout switching while Tune is open
- slider to apply-button flow

If one Tune panel is wrong but another is correct, first check whether the
runtime call path is split between `app.js` and `src/ui/pages/tune.ts`.

### Compare

Compare is now largely TS-owned at runtime, but `app.js` still contains legacy
duplicates. Be careful not to fix the dead path while the bridge points to the
new one.

### Overview

Overview rendering is TS-owned at runtime. If something looks empty, check
whether a legacy helper is still writing into the same DOM after the TS render.

## Testing Strategy

Required automated gate:

```bash
npm run typecheck
npm run canary
npm run build
```

Recommended manual checks after UI or migration work:
- overview hero, stat bars, radar, fit box, and warnings
- tune slider, delta bars, OBS chip, apply flow
- compare slots, verdict, and radar
- compendium and strings page loading and action buttons
- create, save, activate, and reset flows from the dock

## Common Pitfalls

1. `data.js` is generated, not hand-authored.
2. Tailwind CDN means runtime-generated utility class names are risky.
3. Dark mode is driven by `data-theme="dark"` on `<html>`.
4. `swingweight` uses a lowercase `w` in the data model.
5. The same function name may exist in both `app.js` and TS, but only one may be live.
6. A working render can still be wrong if it is driven by stale runtime state.

## Deployment

GitHub Pages deploys from pushes to `main`.

```bash
git push origin main
```

Actions:
`https://github.com/zaldytb/loadout-lab/actions`

Mirror:
`https://loadout-lab.vercel.app`

## Next Migration Reference

Use [ts-migration-plan.md](ts-migration-plan.md) as the current continuation document.
