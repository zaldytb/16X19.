# Plan: Maximize Zustand SSOT for Faster App Experience

## Context

The app has a working Zustand store but it's underutilized. Compare state lives in a **dual-mirror** pattern (module-level `_state` + Zustand copy), the store has 4 `unknown`-typed fields requiring unsafe casts everywhere, persistence is fragmented across 3 separate localStorage patterns, and there's a duplicate `getSetupFromLoadout` function. These cause unnecessary write cascades, type unsafety, and wasted synchronization overhead on every state change.

**Goal:** Consolidate Zustand as the true SSOT, reduce write cascades, and eliminate redundant state mirrors -- all without changing a single pixel.

---

## Phase 1: Type Safety + Remove Duplicate Code
**Impact: Medium | Risk: Lowest | Effort: Small**

No behavioral changes. Unlocks type safety for all subsequent phases.

### Changes

1. **`src/state/useAppStore.ts`** -- Type the 4 `unknown` fields:
   - `comparisonSlots: unknown[]` → `comparisonSlots: CompareSlotData[]` (define a serializable type or import from compare types)
   - `comparisonRadarChart: unknown | null` → proper Chart.js dataset type or `RadarDataset[] | null`
   - `currentRadarChart: unknown | null` → same
   - `slotColors: unknown[]` → `SlotColor[]`

2. **`src/state/imperative.ts`** -- Remove all `<T = unknown>` generics and `as T` / `as unknown[]` casts from: `getComparisonSlots`, `setComparisonSlots`, `getComparisonRadarChart`, `setComparisonRadarChart`, `getCurrentRadarChart`, `setCurrentRadarChart`, `getSlotColors`, `setSlotColors`

3. **`src/state/loadout.ts`** (lines 204-229) -- Delete the uncached duplicate `getSetupFromLoadout`. Redirect callers to the cached version in `src/state/setup-from-loadout.ts`. Callers: `loadout.ts` internal usage, `src/ui/pages/shell.ts`

### Verify
- `npm run typecheck` -- zero errors, zero `unknown` casts on compare/radar/slot fields
- `npm run build && npm run canary && npm run test:runtime`

---

## Phase 2: Lift Compare State into Zustand (Kill the Dual Mirror)
**Impact: HIGHEST | Risk: Medium | Effort: Medium**

Today every compare mutation fires a 4-step cascade: module `_state` write → `syncLegacyMirror()` (Zustand write) → `_persistSlots()` (localStorage write) → subscriber notification → coordinator notification. After this phase: **one Zustand write** handles everything.

### Changes

1. **`src/state/useAppStore.ts`** -- Add compare state directly:
   ```
   compareSlots: Slot[]                    // replaces comparisonSlots
   compareActiveSlotId: SlotId | null
   compareEditingSlotId: SlotId | null
   ```
   Add actions: `setCompareSlotLoadout`, `clearCompareSlot`, `setCompareEditingSlot`, `moveCompareSlot`, `resetCompare`.
   
   Add `subscribeWithSelector` middleware wrapper so downstream can subscribe to specific slices with shallow equality.
   
   Initialize `compareSlots` from localStorage `tll-compare-slots` in the store factory (move `_loadPersistedSlots` logic here). Persist inside each write action (or via simple subscriber).

2. **`src/ui/pages/compare/hooks/useCompareState.ts`** -- Convert to **thin facade** over Zustand:
   - Delete: `let _state`, `_subscribers`, `syncLegacyMirror`, `hydrateFromAppState`, `notify`, `_persistSlots`, `_loadPersistedSlots`, `_freshSlots`
   - Keep all exported function signatures (`getState`, `subscribe`, `setSlotLoadout`, `clearSlot`, `setEditingSlot`, `moveSlot`, `reset`, `getConfiguredSlots`, `getEmptySlots`, `getFirstEmptySlot`, `canAddSlot`, `addLoadout`)
   - Each function delegates to `useAppStore.getState().actionName()` or reads from `useAppStore.getState()`
   - This preserves the API for all 6 consumers (compare/index.ts, compare-slot-api.ts, shell.ts, optimize.ts, compendium.ts, presets.ts)

3. **`src/runtime/compare-refresh-bridge.ts`** -- `notifyCompareStateChanged()` becomes a no-op. The coordinator subscribes to Zustand directly.

4. **`src/runtime/coordinator.ts`** -- Replace `registerCompareStateRefreshHandler` callback with a Zustand subscription:
   ```typescript
   useAppStore.subscribe(
     (s) => s.compareSlots,
     () => syncViews('compare-state-change', { compareState: true }),
     { equalityFn: shallow }
   );
   ```

5. **Move `normalizeCompareSlots`** from read path (`getState`) to write path (actions). Reads become pure lookups.

### Consumers (no import changes needed)
- `src/ui/pages/compare/index.ts` -- calls `getState`, `subscribe`, `setSlotLoadout`, `clearSlot`, `setEditingSlot`, `moveSlot`, `reset`
- `src/ui/pages/compare/compare-slot-api.ts` -- calls `getState`, `setSlotLoadout`, `clearSlot`, etc.
- `src/ui/pages/shell.ts` -- calls `clearCompareSlot`, `getCompareState`, `setCompareSlotLoadout`
- `src/ui/pages/optimize.ts` -- calls `compareGetState`, `compareSetSlotLoadout`
- `src/ui/pages/compendium.ts` -- calls `compareGetState`, `compareSetSlotLoadout`
- `src/ui/shared/presets.ts` -- calls `compareGetState`

### Verify
- Compare page: add/edit/clear/move/reset slots all work identically
- `localStorage.getItem('tll-compare-slots')` -- same JSON structure after adding slots
- Page reload: compare slots rehydrate
- Performance: DevTools Performance tab -- fewer sync side effects per mutation
- `npm run typecheck && npm run build && npm run canary && npm run test:runtime`

---

## Phase 3: Granular Compare Hooks
**Impact: Medium | Risk: Low | Effort: Small**
*Depends on Phase 2*

### Changes

1. **`src/hooks/useCompare.ts`** -- Replace `useState + useEffect(subscribe)` with Zustand selectors:
   ```typescript
   export function useCompareSlots() {
     return useAppStore((s) => s.compareSlots);
   }
   export function useCompareEditingSlotId() {
     return useAppStore((s) => s.compareEditingSlotId);
   }
   export function useCompareState(): CompareState {
     return useAppStore((s) => ({
       slots: s.compareSlots,
       activeSlotId: s.compareActiveSlotId,
       editingSlotId: s.compareEditingSlotId,
     }), shallow);
   }
   ```

2. Note: Currently **no React `.tsx` components** import `useCompareState` (confirmed by grep). The immediate win is eliminating the `useState+subscribe` anti-pattern so future React islands get granular reactivity. The imperative modules use `getState()` directly and are unaffected.

### Verify
- `npm run typecheck && npm run build`

---

## Phase 4: Unified Persistence via `zustand/middleware/persist`
**Impact: Medium | Risk: Medium | Effort: Medium**
*Depends on Phase 2*

### Changes

1. **`src/state/useAppStore.ts`** -- Wrap store with `persist` middleware:
   - `partialize`: serialize `activeLoadout`, `savedLoadouts`, `compareSlots`
   - Storage key: `tll-app-state`
   - `version: 1` with `migrate` function that reads legacy keys (`tll-active-loadout`, `tll-loadouts`, `tll-compare-slots`) on first run

2. **`src/state/active-loadout-storage.ts`** -- `persistActiveLoadout()` becomes no-op. Keep `loadActiveLoadout()` for migration only.

3. **`src/state/loadout.ts`** -- Remove manual `persistSavedLoadouts()` calls from `saveLoadout`, `removeLoadout`, `importLoadouts`.

4. **`src/ui/pages/shell.ts`** -- Remove manual persistence calls during boot. Store hydrates itself.

5. **`src/state/useAppStore.ts`** -- Remove `persistActiveLoadout(lo)` call from `setActiveLoadout` action.

### Verify
- Fresh browser: clean slate
- Create loadout → reload → loadout persists
- Add compare slots → reload → slots persist
- DevTools: `tll-app-state` key has correct shape
- Legacy migration: set `tll-active-loadout` manually, clear `tll-app-state`, reload → recovered
- `npm run typecheck && npm run build && npm run canary && npm run test:runtime`

---

## Phase 5: Coordinator Subscription Simplification (Optional)
**Impact: Low-Medium | Risk: Low | Effort: Small**

Replace some manual `syncViews` calls with direct Zustand subscriptions in `src/runtime/coordinator.ts`:
```typescript
useAppStore.subscribe(
  (s) => s.activeLoadout,
  () => { hydrateDock(getActiveLoadout()); renderDockPanel(); }
);
```

Keep `syncViews` as escape hatch for route-change orchestration.

---

## What NOT to Migrate

**Page-level module state** (tune.ts ~17 vars, optimize.ts ~15 vars, compendium.ts, strings.ts, leaderboard.ts):
- Page-scoped, not shared across pages
- Consumed only by imperative render functions in the same module
- Will be replaced by full React pages with local state during Strangler Fig migration
- Moving to Zustand adds store size without perf benefit

---

## Phase Dependency Graph

```
Phase 1 (types) ── no dependencies
    ↓
Phase 2 (compare SSOT) ── depends on Phase 1
    ↓         ↓
Phase 3    Phase 4    (can run in parallel)
    ↓         ↓
Phase 5 (coordinator) ── benefits from Phase 2+4
```

## Critical Files
- `src/state/useAppStore.ts`
- `src/ui/pages/compare/hooks/useCompareState.ts`
- `src/state/imperative.ts`
- `src/state/loadout.ts`
- `src/runtime/coordinator.ts`
- `src/runtime/compare-refresh-bridge.ts`
- `src/hooks/useCompare.ts`
- `src/state/active-loadout-storage.ts`
- `src/ui/pages/shell.ts`

## Verification (end-to-end after all phases)
1. `npm run typecheck` -- zero errors
2. `npm run build` -- clean production build
3. `npm run canary` -- OBS/archetype baselines pass
4. `npm run test:runtime` -- runtime hardening tests pass
5. Manual: tab switching performance, compare slot add/edit/clear/move/reset, page reload persistence, Overview/Tune/Compare/Optimize all render correctly
