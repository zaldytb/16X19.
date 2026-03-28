# 16X19 / Tennis Loadout Lab

Frame x String x Tension prediction tool for tennis setups.

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

Primary URL: `https://zaldytb.github.io/loadout-lab/`
Mirror: `https://loadout-lab.vercel.app`

## Stack

- Vite 8
- TypeScript 6 in strict mode
- JavaScript compatibility layer in `app.js`
- Tailwind CSS 4 via CDN plus custom CSS
- Chart.js via CDN
- Node.js 20+

## Quick Start

```bash
npm install
npm run dev
npm run typecheck
npm run canary
npm run build
```

## Current Architecture

The migration is well underway.

TypeScript now owns the main runtime entrypoints for:
- shell and mode switching
- overview
- tune runtime
- compare
- optimize
- compendium
- strings

`app.js` still exists as a large compatibility layer and fallback bank. It is
smaller than before, but it still contains duplicated legacy implementations
that have not all been deleted yet.

Current high-level state:
- `src/engine/` is TypeScript and strict
- `src/state/` is TypeScript and is the source of truth for loadouts
- `src/ui/pages/` contains the main extracted page modules
- `src/main.js` is the bridge from modules to `window.*` for inline handlers
- `app.js` is still the remaining monolith and compatibility surface

## Source Layout

```text
loadout-lab/
|- index.html
|- app.js
|- style.css
|- data.js
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
|- docs/
`- .github/workflows/
```

## Prediction Engine

The engine is deterministic. The same setup always produces the same output.

Pipeline:
- L0: frame physics normalization
- L1: string profile plus frame coupling
- L2: tension effects
- L3: hybrid interaction

Core outputs:
- 11 attribute scores
- build identity / archetype
- OBS composite score and tier

## State Model

The active loadout is the source of truth for the live app.

Important state modules:
- `src/state/store.ts`: active and saved loadouts
- `src/state/setup-sync.ts`: setup derivation from loadouts
- `src/state/app-state.ts`: shared runtime UI state such as mode and compare state

## Migration Notes

What is already extracted:
- Compendium
- String Compendium
- Shell ownership
- Overview runtime ownership
- Compare runtime ownership
- Tune runtime ownership

What still remains in the monolith:
- duplicated legacy renderers and wrappers in `app.js`
- Tune recommendation content still sourced from `app.js`
- `leaderboard.js` is still JavaScript

See [ts-migration-plan.md](ts-migration-plan.md) for the current continuation plan.

## Data Pipeline

Source of truth:
- `pipeline/data/frames.json`
- `pipeline/data/strings.json`
- `pipeline/data/canaries.json`

Generated browser data:
- `data.js`

Never edit `data.js` directly.

Useful commands:

```bash
npm run validate
npm run export
npm run pipeline
npm run ingest:frame
npm run ingest:string
npm run scrape:twu
npm run scrape:twu-strings
```

## Testing

Required checks before pushing:

```bash
npm run typecheck
npm run canary
npm run build
```

Manual smoke checks are especially important after UI migrations:
- overview renders correctly
- tune slider, delta card, OBS card, and apply flow stay in sync
- compare renders slots, verdicts, and radar
- compendium and strings load without console errors
- save, activate, reset, and compare flows work from the dock

## Deployment

GitHub Pages deploys from `main`.

```bash
git push origin main
```

GitHub Actions:
`https://github.com/zaldytb/loadout-lab/actions`

Vercel mirror:
`https://loadout-lab.vercel.app`
