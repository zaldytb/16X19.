// src/state/setup-sync.ts
// Setup synchronization between active loadout and editor DOM

import { useAppStore } from './useAppStore.js';
import { selectCurrentSetup } from './selectors.js';
import { reportRuntimeIssue } from '../runtime/diagnostics.js';
import type { SetupResult } from './setup-from-loadout.js';
import { getSetupFromLoadout } from './setup-from-loadout.js';

export type { SetupResult } from './setup-from-loadout.js';
export { getSetupFromLoadout } from './setup-from-loadout.js';

interface StringCompendiumSync {
  frameId: string;
  stringId: string | null;
  isHybrid: boolean;
  mainsId: string | null;
  crossesId: string | null;
  mainsTension: number;
  crossesTension: number;
  gauge?: string | null;
  mainsGauge?: string | null;
  crossesGauge?: string | null;
}

/**
 * Get current setup — reads from activeLoadout when available,
 * falls back to DOM editor for creation form / no-loadout state.
 * This is the primary function to get the current build.
 */
export function getCurrentSetup(): SetupResult | null {
  const activeLoadout = useAppStore.getState().activeLoadout;
  if (activeLoadout) {
    const setup = selectCurrentSetup(useAppStore.getState());
    if (!setup) {
      reportRuntimeIssue('ACTIVE_SETUP_INVALID', 'Active loadout could not be resolved into a complete setup.', {
        details: activeLoadout,
      });
    }
    return setup;
  }
  return null;
}

/**
 * Sync compendium with active loadout state
 * Returns the racquet ID that should be selected
 */
export function syncCompendiumWithActiveLoadout(): string | null {
  const activeLoadout = useAppStore.getState().activeLoadout;
  if (!activeLoadout) return null;
  return activeLoadout.frameId;
}

/**
 * Sync string compendium with active loadout
 * Returns string configuration for injection
 */
export function syncStringCompendiumWithActiveLoadout(): StringCompendiumSync | null {
  const activeLoadout = useAppStore.getState().activeLoadout;
  if (!activeLoadout) return null;

  return {
    frameId: activeLoadout.frameId,
    stringId: activeLoadout.stringId,
    isHybrid: activeLoadout.isHybrid,
    mainsId: activeLoadout.mainsId,
    crossesId: activeLoadout.crossesId,
    mainsTension: activeLoadout.mainsTension,
    crossesTension: activeLoadout.crossesTension,
    gauge: activeLoadout.gauge,
    mainsGauge: activeLoadout.mainsGauge,
    crossesGauge: activeLoadout.crossesGauge
  };
}
