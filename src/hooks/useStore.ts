import { useSyncExternalStore } from 'react';
import { getActiveLoadout, getSavedLoadouts, subscribe } from '../state/store.js';
import { getCurrentSetup } from '../state/setup-sync.js';

export type CurrentSetup = NonNullable<ReturnType<typeof getCurrentSetup>>;

export function useActiveLoadout() {
  return useSyncExternalStore(
    (cb) => subscribe('activeLoadout', cb),
    getActiveLoadout,
    getActiveLoadout,
  );
}

export function useSavedLoadouts() {
  return useSyncExternalStore(
    (cb) => subscribe('savedLoadouts', cb),
    getSavedLoadouts,
    getSavedLoadouts,
  );
}

/** Canonical racquet/string setup from active loadout (null if none). */
export function useCurrentSetup(): CurrentSetup | null {
  return useSyncExternalStore(
    (cb) => subscribe('activeLoadout', cb),
    () => getCurrentSetup(),
    () => getCurrentSetup(),
  );
}
