# TypeScript migration — current status

## Summary

The browser app is **TypeScript-first** with **Vite** as the bundler. The legacy root **`app.js` monolith has been removed**. Runtime behavior is implemented in `src/**/*.ts` and exposed to `index.html` through **[`src/main.ts`](src/main.ts)** (`window.*` bridge). Declarations for that bridge live in **[`src/global.d.ts`](src/global.d.ts)**.

Pipeline tooling under **`pipeline/scripts/`** is **`.ts`** and is executed with **`tsx`** (see root `package.json` scripts).

## Architecture (current)

| Area | Location |
|------|-----------|
| Engine | `src/engine/` |
| State | `src/state/` |
| UI | `src/ui/` |
| Vite + bridge entry | `src/main.ts` |
| Types for `window` | `src/global.d.ts` |
| Vite config | `vite.config.ts` |
| Data source | `pipeline/data/*.json` |
| Generated app data import | `src/data/generated.ts` (from `npm run export`) |
| Compatibility artifact | `data.js` (from `npm run export`) |

## Ownership rules (for agents)

1. **`src/main.ts`** is the single source of which global names map to which implementations.
2. Prefer fixing behavior in the **TypeScript module**, not by adding parallel globals.
3. **Do not** switch the SPA from Tailwind **CDN** to a Vite Tailwind plugin without a dedicated parity audit — dynamic class strings in TS must stay unchanged.
4. **`src/data/generated.ts`** and **`data.js`** are generated only — edit JSON and run `npm run pipeline` / `npm run export`.

## Verification

```bash
npm run typecheck && npm run canary && npm run build
```

## Optional follow-ups (non-blocking)

- Remove or archive historical migration prompts (`codex-migration-prompt.md`, `migration-finish-prompt.md`, `walkthrough.md`) if you no longer need line-level audits of the old monolith.
- **`pipeline/engine/leaderboard-v2.ts`** — legacy reference; live leaderboard UI is `src/ui/pages/leaderboard.ts`.
- **`tools/frame-gui`** is now an isolated **TypeScript** Electron project; it compiles to `tools/frame-gui/build/` and spawns **`tsx pipeline/scripts/ingest.ts`** for imports.
- Align any remaining comments in `tools/*.html` that still say `node …/ingest.js` with **`tsx pipeline/scripts/ingest.ts`** (or use **`npm run ingest:frame`** / **`npm run ingest:string`** in docs).

## Definition of done (met)

- Page runtimes live under `src/**/*.ts`.
- Leaderboard is TypeScript (`leaderboard.ts`).
- Bridge entry is `src/main.ts` (not `main.js`).
- Automated gate passes: typecheck, canary, build.
