# TypeScript Migration Checklist

This checklist reflects the current migration state of `loadout-lab` after the shell, Tune, Compare, Compendium, and Strings cutovers.

## Completed

- [x] Engine migrated into `src/engine/*`
- [x] Loadout/store state migrated into `src/state/*`
- [x] Shared app runtime state extracted into `src/state/app-state.ts`
- [x] Shell ownership moved into `src/ui/pages/shell.ts`
- [x] Overview runtime routed through `src/ui/pages/overview.ts`
- [x] Tune runtime routed through `src/ui/pages/tune.ts`
- [x] Tune recommendation panels moved into TypeScript
- [x] Tune recommendation Apply/Save actions moved into TypeScript
- [x] Compendium extracted to `src/ui/pages/compendium.ts`
- [x] Strings extracted to `src/ui/pages/strings.ts`
- [x] Compare runtime bridged to TypeScript from `src/ui/pages/compare.ts`
- [x] Compare delegate wrappers added in `app.js`
- [x] Compare slot colors backed by `app-state`
- [x] Compendium compare actions moved off raw `window.comparisonSlots`
- [x] Optimize compare actions moved off raw `window.comparisonSlots`
- [x] Leaderboard compare action moved off legacy compare array
- [x] Leaderboard compare now fills next available slot and blocks when full
- [x] Dock compare quick-add/remove prefer new Compare APIs

## Stable But Still Transitional

- [x] `app.js` acts primarily as compatibility glue plus legacy fallback
- [x] `src/main.js` bridges page modules to `window`
- [x] `window.currentMode`, `window.comparisonSlots`, `window.comparisonRadarChart`, and `window.SLOT_COLORS` are compatibility shims backed by `app-state`
- [x] Legacy Compare and Tune functions in `app.js` delegate to TypeScript first
- [x] Overview, Tune, Compare, Compendium, and Strings all have active TypeScript owners

## Remaining High-Priority Cleanup

- [ ] Remove or dead-code-isolate unreachable legacy Compare implementation blocks in `app.js`
- [ ] Remove or dead-code-isolate unreachable legacy Tune implementation blocks in `app.js`
- [ ] Remove or dead-code-isolate duplicate Overview implementation blocks in `app.js`
- [ ] Audit `app.js` compare helpers that still mutate legacy slot state directly
- [ ] Replace remaining legacy compare fallback paths with new Compare API calls
- [ ] Reduce `app.js` to a thin bootstrap/compat layer

## Remaining Medium-Priority Cleanup

- [ ] Convert `src/ui/pages/leaderboard.js` to `leaderboard.ts`
- [ ] Review dock compare/edit flows against the new Compare tab store for any leftover legacy assumptions
- [ ] Review compendium/optimize/quiz entrypoints for any remaining legacy `window.*` state mutations
- [ ] Remove stale comments in docs and source that still describe Compare state as `app.js`-owned
- [ ] Revisit bundle size after cleanup and consider code-splitting if worthwhile

## Verification Checklist

- [ ] `npm run typecheck`
- [ ] `npm run canary`
- [ ] `npm run build`
- [ ] Overview renders hero, stat bars, radar, fit-grid, and warnings
- [ ] Tune keeps delta card, OBS card, WTTN, recommendations, and apply flow in sync
- [ ] Compare add/edit/remove works from the Compare page
- [ ] Compare add flows work from dock, saved loadouts, leaderboard, compendium, and optimize
- [ ] Compendium and Strings load and interact without console errors
- [ ] Switching modes does not desync runtime state

## Suggested Next Order

1. Delete or isolate legacy Compare blocks in `app.js`
2. Delete or isolate legacy Tune blocks in `app.js`
3. Delete or isolate duplicate Overview blocks in `app.js`
4. Convert `leaderboard.js` to TypeScript
5. Trim `app.js` down to bootstrap and compatibility shims only
