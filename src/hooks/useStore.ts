import { useMemo } from 'react';
import { useAppStore } from '../state/useAppStore.js';
import { getSetupFromLoadout } from '../state/setup-from-loadout.js';

export type CurrentSetup = NonNullable<ReturnType<typeof getSetupFromLoadout>>;

export function useActiveLoadout() {
  return useAppStore((state) => state.activeLoadout);
}

export function useSavedLoadouts() {
  return useAppStore((state) => state.savedLoadouts);
}

/** Canonical racquet/string setup from active loadout (null if none). */
export function useCurrentSetup(): CurrentSetup | null {
  const activeLoadout = useAppStore((state) => state.activeLoadout);
  return useMemo(() => getSetupFromLoadout(activeLoadout), [activeLoadout]);
}

export function useCurrentMode() {
  return useAppStore((state) => state.currentMode);
}

export function useComparisonSlots() {
  return useAppStore((state) => state.comparisonSlots);
}

export function useDockEditorContext() {
  return useAppStore((state) => state.dockEditorContext);
}
