import { useAppStore } from '../state/useAppStore.js';
import { getCurrentSetup } from '../state/setup-sync.js';

export type CurrentSetup = NonNullable<ReturnType<typeof getCurrentSetup>>;

export function useActiveLoadout() {
  return useAppStore((state) => state.activeLoadout);
}

export function useSavedLoadouts() {
  return useAppStore((state) => state.savedLoadouts);
}

/** Canonical racquet/string setup from active loadout (null if none). */
export function useCurrentSetup(): CurrentSetup | null {
  const activeLoadout = useAppStore((state) => state.activeLoadout);
  if (!activeLoadout) return null;
  return getCurrentSetup();
}

// Additional selectors for app state
export function useCurrentMode() {
  return useAppStore((state) => state.currentMode);
}

export function useComparisonSlots() {
  return useAppStore((state) => state.comparisonSlots);
}

export function useDockEditorContext() {
  return useAppStore((state) => state.dockEditorContext);
}
