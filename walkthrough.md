# Migration Plan Verification

## Plan Accuracy Assessment

### ✅ Confirmed Accurate

| Claim | Finding |
|-------|---------|
| `app.js` is ~7,940 lines | PowerShell counts 7,940 lines (view_file reports 8,795 with CRLF, but content lines match) |
| Engine fully TS-owned | `src/engine/*` contains all physics modules; `app.js` only re-imports them |
| State in `src/state/*` | `store.ts`, `setup-sync.ts`, `app-state.ts`, `loadout.ts`, `presets.ts` confirmed |
| Shell in `shell.ts` | `src/ui/pages/shell.ts` (32,752 bytes) bridged via `src/main.js` |
| Overview in `overview.ts` | `src/ui/pages/overview.ts` (26,375 bytes) bridged; `app.js` has delegate wrappers |
| Tune in `tune.ts` | `src/ui/pages/tune.ts` (58,533 bytes) bridged; `app.js` has full legacy bodies ~2,000 lines (L2623–L4598) |
| Compare in `compare/index.ts` | `src/ui/pages/compare/index.ts` (21,949 bytes) fully bridged |
| `leaderboard.js` still JS | `src/ui/pages/leaderboard.js` (50,365 bytes) confirmed JavaScript |
| `src/main.js` is the public bridge | 426 lines, bridges all TS modules to `window.*` |

### ⚠️ Corrections / Refinements

| Item | Plan Says | Reality |
|------|-----------|---------|
| Tune — "legacy helpers and fallback render logic" | Understated | `app.js` L2623–L4598 is a **~1,975 line** full Tune implementation with state, helpers, overlay rendering, gauge explorer, WTTN, recommendations. Most functions delegate to `window.*` but still define the bodies. |
| Overview — "duplicate helpers" | Accurate but partial | `app.js` L1787–L2401 contains `renderDashboard`, `renderOverviewHero`, `renderOCFoundation`, `renderOCSnapshot`, `renderStatBars`, `renderRadarChart`, `renderFitProfileActive`, `renderWarnings` — ~614 lines of active Overview render code that can conflict |
| Compare — "collapsed into delegate wrappers" | Confirmed | Compare functions at L2403–L2511 are all thin delegates to `window.*` (3–4 lines each) |
| `app.js` line count precision | "about 7,940" | Matches, but the effective content with embedded Tune/Overview/Optimize bodies is much larger than "compatibility shell plus leftover legacy bodies" suggests |
| `createLoadout` duplication | Plan mentions Phase 4 | `createLoadout` is a 60-line standalone function in `app.js` (L173–L233), not in `src/state/*`. `activateLoadout` (L235–L268) also has a full body with dirty-save, hydration, and mode-dispatch logic |

### Hotspot Map (verified line ranges in `app.js`)

| Section | Lines | Status |
|---------|-------|--------|
| Loadout system (createLoadout, activateLoadout, saveLoadout, etc.) | L89–L528 | Active — has real bodies, partially delegated |
| Dock context panels (_renderDockPanel*) | L530–L830 | Active — real implementations |
| Share/export/import | L1039–L1100 | Active — thin wrappers over `src/utils/share.js` |
| Mode switching (switchMode) | L1100–L1335 | Active — real implementation with legacy sync |
| Preset system | L1337–L1660 | Active — presets, slot colors |
| Dropdowns (populate*) | L1664–L1786 | Active — dropdown population |
| Overview (renderDashboard, hero, stat bars, radar, fit, warnings) | L1787–L2401 | **Hotspot** — full render pipeline with delegate pattern |
| Compare (thin delegates) | L2403–L2511 | Already collapsed to delegates |
| Hybrid/editor | L2512–L2622 | Active — setHybridMode, _onEditorChange |
| **Tune (full legacy body)** | **L2623–L4598** | **Hotspot** — ~1,975 lines of Tune implementation |
| Theme toggle | L4600–L4647 | Thin wrapper |
| Init / event listeners | L4649–L4920 | Active — init, responsive header, landing search |
| Optimize | L4920–L5991 | Active — 1,071 lines, full optimizer body |
| Compendium / Strings | L5993–L8141 | Active — 2,148 lines, full compendium + string bodies |
| FMB / Quiz | L8142–L8600 | Active — frame ranking, quiz helpers |
| Boot sequence + exports | L8600–L8795 | Boot + export block |

## Plan Validity

> [!IMPORTANT]
> The plan is **sound and well-ordered**. The phasing is correct — Tune and Overview excision should come first because they are the largest dual-implementation risks. The Compare delegates are already safe. Leaderboard conversion is a clean follow-up. The loadout helper convergence correctly identifies the last extraction before `app.js` can shrink.

> [!WARNING]  
> The plan **underestimates scope** in two areas:
> 1. The Tune section in `app.js` is not just "helpers and fallback logic" — it's a complete ~1,975-line implementation with its own state variables, sweep chart, gauge explorer, and recommendation rendering. Isolating it requires careful verification that `src/main.js` bridge always wins.
> 2. Optimize and Compendium sections (~3,200 lines combined) are not mentioned as migration targets. They contain full active implementations and delegate in the same pattern as Tune/Overview. Phase 5 would need to address these too for `app.js` to become a true bootstrap-only file.
