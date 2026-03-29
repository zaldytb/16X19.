# 16X19 / Tennis Loadout Lab

Frame × String × Tension prediction for tennis setups.

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

- **Vite 8** — dev server and production bundle
- **TypeScript 6** — strict mode for `src/` (engine, state, UI)
- **Tailwind CSS 4** — loaded from the **CDN** in `index.html` (inline `tailwind.config`); custom tokens in `style.css`
- **Chart.js** — loaded from CDN for radar and sweep charts
- **Node.js 20+** — data pipeline and tooling (`tsx` for TypeScript scripts)

There is **no** root `app.js` monolith. The Vite entry is [`src/main.ts`](src/main.ts), which assigns implementations from TypeScript modules to `window.*` for inline HTML handlers in `index.html`.

## Quick start

```bash
npm install
npm run dev
npm run typecheck
npm run canary
npm run build
```

## Architecture (summary)

| Layer | Location | Role |
|--------|-----------|------|
| Engine | `src/engine/` | Deterministic prediction (L0–L3 + composite) |
| State | `src/state/` | Loadouts, setup sync, app/compare UI state |
| UI | `src/ui/` | Pages, dock, shared renderers |
| Bridge | `src/main.ts` | `window.*` exports for `onclick` / legacy names |
| Data | `pipeline/data/*.json` → `npm run export` → `src/data/generated.ts` + `data.js` | Source of truth vs generated app/compat outputs |

See [AGENTS.md](AGENTS.md) for agent-oriented detail and debugging notes.

## Repository layout

```text
16X19/
├── index.html
├── vite.config.ts
├── style.css
├── data.js                 # generated compatibility artifact — do not edit
├── src/
│   ├── main.ts             # Vite entry + window bridge
│   ├── global.d.ts         # Window typings for the bridge
│   ├── vite-env.d.ts
│   ├── engine/
│   ├── state/
│   ├── ui/
│   │   ├── pages/          # shell, overview, tune, compare, …
│   │   ├── components/
│   │   └── shared/
│   ├── data/
│   └── utils/
├── pipeline/
│   ├── data/
│   ├── schemas/
│   ├── scripts/*.ts        # validate, export, canary, ingest, … (run with tsx)
│   └── engine/             # legacy / reference (e.g. leaderboard-v2.ts)
├── docs/                   # in-repo wiki-style guides
├── tools/                  # frame-gui, helpers
└── .github/workflows/
```

## Prediction engine

The engine is deterministic: identical inputs always yield identical outputs.

Pipeline stages:

- **L0:** frame physics normalization  
- **L1:** string profile and frame coupling  
- **L2:** tension effects  
- **L3:** hybrid interaction  

Outputs include 11 attribute scores, build identity / archetype, OBS composite score and tier.

## State model

The **active loadout** is the source of truth for the live app.

- `src/state/store.ts` — active and saved loadouts  
- `src/state/setup-sync.ts` — racquet/string setup from the active loadout  
- `src/state/app-state.ts` — mode, compare slots, shared UI coordination  

## Data pipeline

**Source of truth (edit these):**

- `pipeline/data/frames.json`
- `pipeline/data/strings.json`
- `pipeline/data/canaries.json`

**Generated (never hand-edit):**

- `src/data/generated.ts` — produced by `npm run export` / `npm run pipeline`, used by the app
- `data.js` — compatibility artifact produced by `npm run export` / `npm run pipeline`

```bash
npm run validate          # schema validation
npm run export            # JSON → src/data/generated.ts + data.js
npm run export:verify     # export + canary
npm run pipeline          # validate + export:verify
npm run ingest:frame
npm run ingest:string
npm run scrape:twu
npm run scrape:twu-strings
```

Pipeline scripts are **TypeScript** (`.ts`) and run with **`tsx`** (see `package.json`).

## Testing and release checks

Before pushing:

```bash
npm run typecheck && npm run canary && npm run build
```

Manual smoke (after UI or engine changes): overview, tune apply flow, compare slots, compendium/strings, dock save/activate, leaderboard tab.

## Deployment

GitHub Pages builds from `main` (see `.github/workflows/`).

```bash
git push origin main
```

Actions: `https://github.com/zaldytb/loadout-lab/actions`  
Vercel mirror: `https://loadout-lab.vercel.app`

## Further reading

- [AGENTS.md](AGENTS.md) — conventions for contributors and coding agents  
- [docs/README.md](docs/README.md) — documentation index (“wiki”)  
- [docs/Getting-Started.md](docs/Getting-Started.md) — setup, ingest, pipeline  
- [ts-migration-plan.md](ts-migration-plan.md) — migration status and follow-ups  
- [CLAUDE.md](CLAUDE.md) — Claude Code project notes  
