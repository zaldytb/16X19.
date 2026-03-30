# Tennis Loadout Lab — Agent documentation

## Project overview

16X19 (Tennis Loadout Lab) is a physics-based tennis equipment analysis tool. It predicts how a racquet and string setup performs across 11 attributes and summarizes the build with an OBS composite score plus identity and archetype output.

**Primary URL:** `https://zaldytb.github.io/loadout-lab/`  
**Mirror:** `https://loadout-lab.vercel.app`

### Core workflows

- Browse racquets (Racket Bible) and strings (String Compendium)
- Configure full-bed and hybrid builds
- Tune tension with live feedback
- Compare up to three setups
- Optimize and explore recommended builds
- Save, activate, duplicate, and share loadouts

## Technology stack

| Category | Technology |
|----------|------------|
| Build | Vite 8.x |
| App language | TypeScript 6.x (strict) under `src/` |
| Styling | Tailwind CSS 4.x **CDN** (`index.html`) + `style.css` design tokens |
| Package manager | npm |
| Runtime | Node.js 20+ (pipeline via `tsx`) |
| Charts | Chart.js **CDN** (`index.html`) |
| Deploy | GitHub Pages + Vercel |

**Important:** Tailwind is intentionally **not** wired through `@tailwindcss/vite` for the SPA. Runtime-generated utility strings in TypeScript must stay verbatim so CDN JIT output matches production.

## Runtime architecture

### 1. Vite entry and `window` bridge

[`src/main.tsx`](src/main.tsx) is the only application entry. It:

- imports page and shared modules from `src/`
- assigns functions and state to `window.*` for `onclick="..."` and legacy global names
- lazy-loads heavy pages (e.g. compendium, leaderboard) via dynamic `import()`

[`src/global.d.ts`](src/global.d.ts) augments `Window` with the bridge surface (optional properties, permissive call signatures) so strict TypeScript stays compatible with inline HTML handlers.

When debugging, **trace `window.*` from `installWindowBridge()` (see `src/bridge/installWindowBridge.ts`)** — do not assume a second runtime layer.

### 2. No root `app.js`

The historical `app.js` monolith is **removed**. All live page logic lives under `src/**/*.ts`.

### 3. Active loadout is source of truth

- `src/state/store.ts` — active and saved loadouts  
- `src/state/setup-sync.ts` — current racquet/string setup from the active loadout  

### 4. Shared UI state

`src/state/app-state.ts` holds mode, compare slots, radar/slot colors, and other cross-page UI coordination. Prefer this over new ad hoc globals.

## Project structure

```text
loadout-lab/
├── index.html
├── vite.config.ts
├── style.css
├── data.js
├── README.md
├── AGENTS.md
├── CLAUDE.md
├── ts-migration-plan.md
├── src/
│   ├── main.tsx
│   ├── global.d.ts
│   ├── vite-env.d.ts
│   ├── engine/
│   ├── state/
│   │   ├── store.ts
│   │   ├── loadout.ts
│   │   ├── setup-sync.ts
│   │   ├── app-state.ts
│   │   └── presets.ts
│   ├── ui/
│   │   ├── pages/
│   │   │   ├── shell.ts
│   │   │   ├── overview.ts
│   │   │   ├── tune.ts
│   │   │   ├── compare/ …
│   │   │   ├── optimize.ts
│   │   │   ├── compendium.ts
│   │   │   ├── strings.ts
│   │   │   ├── find-my-build.ts
│   │   │   ├── my-loadouts.ts
│   │   │   └── leaderboard.ts
│   │   ├── components/
│   │   └── shared/
│   ├── data/
│   └── utils/
├── pipeline/
├── docs/
└── .github/workflows/
```

## Commands

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

### Data and regression

```bash
npm run validate
npm run export
npm run export:verify
npm run canary
npm run canary:baseline
npm run pipeline
```

### Ingestion and TWU tooling

```bash
npm run ingest:frame
npm run ingest:string
npm run scrape:twu
npm run scrape:twu-strings
npm run enrich:twu
npm run estimate
npm run calibrate
```

Pipeline scripts live in `pipeline/scripts/*.ts` and run with **`tsx`**.

## Data pipeline

**Source of truth:** `pipeline/data/frames.json`, `strings.json`, `canaries.json`  
**Generated:** `src/data/generated.ts` and compatibility `data.js` — never hand-edit; regenerate with `npm run export` or `npm run pipeline`.

## Debugging notes

### Tune

Sensitive to split state paths. When changing Tune, verify together: delta card, OBS in Tune, WTTN, recommendations, loadout switching while Tune is open, slider → apply.

### Compare

Compare runtime is TypeScript (`src/ui/pages/compare/`). Keep dock actions and `app-state` compare slots in sync with the compare module.

### Overview

Overview is TS-owned (`overview.ts`). If the UI looks empty or duplicated, check for a second render pass or stale listeners, not a legacy `app.js` path.

## Testing strategy

**Automated gate (required before commit):**

```bash
npm run typecheck && npm run canary && npm run build
```

**Manual smoke** after UI or engine work: overview hero/bars/radar/fit/warnings; tune; compare; compendium/strings; dock create/save/activate; leaderboard tab.

## Common pitfalls

1. `src/data/generated.ts` and `data.js` are generated — edit JSON under `pipeline/data/` and re-run the pipeline.  
2. Tailwind via CDN — avoid risky dynamic class composition; keep existing utility strings when touching TS templates.  
3. Dark mode: `data-theme="dark"` on `<html>`.  
4. JSON field name: **`swingweight`** (lowercase `w`).  
5. Import paths in TS often end in `.js` (bundler resolution to `.ts` sources).  
6. Stale client state can produce a “working” UI with wrong numbers — verify store + setup-sync when scores look off.

## Deployment

Push to `main` for GitHub Pages; Vercel mirrors the repo.

```bash
git push origin main
```

Actions: `https://github.com/zaldytb/loadout-lab/actions`

## Further reference

- [ts-migration-plan.md](ts-migration-plan.md) — migration status and optional follow-ups  
- [docs/README.md](docs/README.md) — documentation index  
- [CLAUDE.md](CLAUDE.md) — Claude Code checklist and commands  
