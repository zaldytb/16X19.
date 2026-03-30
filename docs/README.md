# Documentation (wiki)

This folder holds **in-repo** guides you can treat like a lightweight wiki (GitHub’s separate Wiki repo is optional; keeping docs here keeps them versioned with the code).

## Pages

| Doc | Purpose |
| --- | ------- |
| [Getting-Started.md](Getting-Started.md) | Install Node, run the dev server, ingest frames/strings, run the pipeline |
| [Frame-ingestion.md](Frame-ingestion.md) | Frames only: `frames.json` → validate → `src/data/generated.ts` + `data.ts` + `FRAME_META` |
| [../README.md](../README.md) | Repository overview, stack, layout, deploy |
| [../AGENTS.md](../AGENTS.md) | Conventions for contributors and coding agents |
| [../CLAUDE.md](../CLAUDE.md) | Claude Code commands and critical rules |
| [../ts-migration-plan.md](../ts-migration-plan.md) | Post-migration architecture snapshot |
| [../tools/frame-gui/README.md](../tools/frame-gui/README.md) | Desktop CSV frame editor (Electron) |

## Quick commands

```bash
npm install
npm run dev              # Vite dev server
npm run pipeline         # validate JSON → export generated app data → canary
npm run ingest:frame     # interactive frame entry
npm run ingest:string    # interactive string entry
```

CSV batch imports use **`tsx pipeline/scripts/ingest.ts`** (or the `npm run ingest:*` flows above). See Getting-Started for column layouts.

## Syncing with GitHub Wiki (optional)

If you use **GitHub Wiki**, copy or summarize these files into wiki pages when you want browser-editable docs. The **source of truth** for the team should stay in this repo so PRs update docs alongside code.
