# TypeScript migration — current status

## Summary

The browser app is **TypeScript-first** with **Vite** as the bundler. The legacy root **`app.js` monolith has been removed**. [`src/main.tsx`](src/main.tsx) mounts the React app, [`src/App.tsx`](src/App.tsx) owns the shell/routing bootstrap, and [`src/bridge/installWindowBridge.ts`](src/bridge/installWindowBridge.ts) now contains boot animation plus vanilla shell/bootstrap helpers rather than a `window.*` bridge.

Pipeline tooling under **`pipeline/scripts/`** is **`.ts`** and is executed with **`tsx`** (see root `package.json` scripts).

## Architecture (current)

| Area | Location |
| ---- | -------- |
| Engine | `src/engine/` |
| State | `src/state/` |
| React shell / routes | `src/App.tsx`, `src/pages/`, `src/components/` |
| Runtime coordination | `src/runtime/` + `src/ui/pages/*-runtime-bridge.ts` |
| Imperative UI modules | `src/ui/` |
| Vite entry | `src/main.tsx` |
| Shell/bootstrap init | `src/App.tsx` + `src/bridge/installWindowBridge.ts` |
| Shared global typings | `src/global.d.ts` (currently minimal) |
| Vite config | `vite.config.ts` |
| Data source | `pipeline/data/*.json` |
| Generated app data import | `src/data/generated.ts` (from `npm run export`) |
| Compatibility artifact | `data.ts` (from `npm run export`) |

## Ownership rules (for agents)

1. Prefer fixing behavior in the **TypeScript module**, not by adding parallel globals or compatibility shims.
2. Cross-module UI actions should use direct imports, delegated listeners, or explicit callback registries through the runtime coordinator when they cross lazy page boundaries.
3. **Do not** change the current mixed Tailwind setup (`@tailwindcss/vite` plus inline `index.html` config) without a dedicated parity audit — dynamic class strings in TS must stay unchanged.
4. **`src/data/generated.ts`** and **`data.ts`** are generated only — edit JSON and run `npm run pipeline` / `npm run export`.

## Verification

```bash
npm run typecheck && npm run canary && npm run build
```

## Optional follow-ups (non-blocking)

- Remove or archive historical migration prompts (`codex-migration-prompt.md`, `migration-finish-prompt.md`, `walkthrough.md`) if you no longer need line-level audits of the old monolith.
- **`tools/frame-gui`** is now an isolated **TypeScript** Electron project; it compiles to `tools/frame-gui/build/` and spawns **`tsx pipeline/scripts/ingest.ts`** for imports.
- Align any remaining comments in `tools/*.html` that still say `node …/ingest.js` with **`tsx pipeline/scripts/ingest.ts`** (or use **`npm run ingest:frame`** / **`npm run ingest:string`** in docs).

## Definition of done (met)

- React routing is `src/main.tsx` → `src/App.tsx`, with imperative workspace logic still living under `src/ui/**/*.ts`.
- Leaderboard is TypeScript (`leaderboard.ts`).
- Startup flow is `src/main.tsx` → `src/App.tsx` → `runVanillaAppInit()`.
- Automated gate passes: typecheck, canary, build.
