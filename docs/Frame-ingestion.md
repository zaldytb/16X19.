# Frame ingestion pipeline

How racquet **frames** move from authoring into the live app bundle.

## Source of truth

- **Edit:** [`pipeline/data/frames.json`](../pipeline/data/frames.json) (via CLI, CSV, or tools below).
- **Schema / ranges:** [`pipeline/schemas/frame.schema.json`](../pipeline/schemas/frame.schema.json).
- **Generated app data:** [`src/data/generated.ts`](../src/data/generated.ts) — **generated** by export; imported by the live app through `src/data/loader.ts`.
- **Compatibility artifact:** [`data.ts`](../data.ts) — **generated** by export; do not hand-edit.

## End-to-end flow

1. **Author** — Append or batch-import validated frame objects into `frames.json`.
2. **Validate** — `npm run validate` (AJV-style checks + range warnings in [`pipeline/scripts/validate.ts`](../pipeline/scripts/validate.ts)).
3. **Export** — `npm run export` runs [`pipeline/scripts/export-to-app.ts`](../pipeline/scripts/export-to-app.ts), which strips pipeline-only fields (`brand`, `_meta`, `_novelty`, `_provenance`, `_staging`) from each frame, writes `RACQUETS`, `FRAME_META`, and `FRAME_NOVELTY_PROFILE` into `src/data/generated.ts`, and rebuilds the root `data.ts` compatibility artifact.
4. **Gate** — `npm run pipeline` runs validate, export with canary verification (`export:verify`).

## Entry points

| Method | Command / tool |
| ------ | -------------- |
| Interactive CLI | `npm run ingest:frame` → [`pipeline/scripts/ingest.ts`](../pipeline/scripts/ingest.ts) (`--type frame`) |
| Batch CSV | `npx tsx pipeline/scripts/ingest.ts --type frame --csv path/to.csv` — column order in [Getting-Started.md](Getting-Started.md) |
| Browser table → CSV | Open [`tools/frame-editor.html`](../tools/frame-editor.html), download CSV, then run ingest as above |
| Electron GUI | [`tools/frame-gui/`](../tools/frame-gui/) — table + “Import” runs the same ingest script |

Ingest builds rows with `buildFrame()`, runs duplicate checks (`checkFrameDuplicates`), and sets `_provenance.source` to `manual` or `csv`.

## Frame-stage tuning fields

Two pipeline-only blocks matter for modeling:

- **`_meta`** — technology / construction tendencies consumed directly by the frame engine:
  - `aeroBonus`
  - `comfortTech`
  - `spinTech`
  - `genBonus`
- **`_novelty`** — reviewer-authored contradiction hints used after frame base calculation and before string blending:
  - `controlBomber`
  - `plushLauncher`
  - `stableWhipper`
  - `preciseSpinner`
  - `comfortableAttacker`

`_novelty` is not user-facing copy. It is a light authoring hint that helps the engine model frame identities that reviewers repeatedly describe as unusually combining traits that should normally trade off.

During export, `_novelty` is folded into generated `FRAME_NOVELTY_PROFILE` data together with bucket rarity / percentile context.

## Optional measured specs

TWU-oriented scripts (e.g. `npm run scrape:twu`, `npm run enrich:twu`) can help populate strung weight, balance, swingweight, and RA when aligning with lab-style data. See [`pipeline/scripts/enrich-twu-csv.ts`](../pipeline/scripts/enrich-twu-csv.ts).

When assigning `_novelty`, think in reviewer language rather than raw spec language:

- Use higher `controlBomber` for frames consistently described as giving free spin/power without losing directional confidence.
- Use higher `plushLauncher` for punchy frames that still feel unusually arm-friendly.
- Use higher `stableWhipper` for frames that keep both stability and whip speed.
- Use higher `preciseSpinner` for spin frames that reviewers still trust on aim.
- Use higher `comfortableAttacker` for point-ending frames that remain plush/connected.

## See also

- [Getting-Started.md](Getting-Started.md) — step-by-step add racquet / string, CSV layouts, pipeline commands.
