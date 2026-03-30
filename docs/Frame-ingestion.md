# Frame ingestion pipeline

How racquet **frames** move from authoring into the live app bundle.

## Source of truth

- **Edit:** [`pipeline/data/frames.json`](../pipeline/data/frames.json) (via CLI, CSV, or tools below).
- **Schema / ranges:** [`pipeline/schemas/frame.schema.json`](../pipeline/schemas/frame.schema.json).
- **Runtime bundle:** [`data.ts`](../data.ts) — **generated** by export; do not hand-edit.

## End-to-end flow

1. **Author** — Append or batch-import validated frame objects into `frames.json`.
2. **Validate** — `npm run validate` (AJV-style checks + range warnings in [`pipeline/scripts/validate.ts`](../pipeline/scripts/validate.ts)).
3. **Export** — `npm run export` runs [`pipeline/scripts/export-to-app.ts`](../pipeline/scripts/export-to-app.ts), which strips pipeline-only fields (`brand`, `_meta`, `_provenance`, `_staging`) from each frame, writes `RACQUETS`, and rebuilds `FRAME_META` keyed by `id`.
4. **Gate** — `npm run pipeline` runs validate, export with canary verification (`export:verify`).

## Entry points

| Method | Command / tool |
|--------|----------------|
| Interactive CLI | `npm run ingest:frame` → [`pipeline/scripts/ingest.ts`](../pipeline/scripts/ingest.ts) (`--type frame`) |
| Batch CSV | `npx tsx pipeline/scripts/ingest.ts --type frame --csv path/to.csv` — column order in [Getting-Started.md](Getting-Started.md) |
| Browser table → CSV | Open [`tools/frame-editor.html`](../tools/frame-editor.html), download CSV, then run ingest as above |
| Electron GUI | [`tools/frame-gui/`](../tools/frame-gui/) — table + “Import” runs the same ingest script |

Ingest builds rows with `buildFrame()`, runs duplicate checks (`checkFrameDuplicates`), and sets `_provenance.source` to `manual` or `csv`.

## Optional measured specs

TWU-oriented scripts (e.g. `npm run scrape:twu`, `npm run enrich:twu`) can help populate strung weight, balance, swingweight, and RA when aligning with lab-style data. See [`pipeline/scripts/enrich-twu-csv.ts`](../pipeline/scripts/enrich-twu-csv.ts).

## See also

- [Getting-Started.md](Getting-Started.md) — step-by-step add racquet / string, CSV layouts, pipeline commands.
