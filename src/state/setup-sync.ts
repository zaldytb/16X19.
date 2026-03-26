// src/state/setup-sync.ts
// Setup synchronization between active loadout and editor DOM

import { getActiveLoadout } from './loadout.js';
import type { Loadout, Racquet, StringData, StringConfig } from '../engine/types.js';
import { RACQUETS, STRINGS } from '../data/loader.js';
import { applyGaugeModifier } from '../engine/string-profile.js';

interface SetupResult {
  racquet: Racquet;
  stringConfig: StringConfig;
  loadout: Loadout;
}

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
  const activeLoadout = getActiveLoadout();
  if (activeLoadout) {
    return getSetupFromLoadout(activeLoadout);
  }
  return null; // Would need DOM access for _getSetupFromEditorDOM
}

/**
 * Get setup from a loadout object (pure function)
 */
export function getSetupFromLoadout(loadout: Loadout | null): SetupResult | null {
  if (!loadout) return null;
  const racquet = RACQUETS.find(r => r.id === loadout.frameId) as Racquet | undefined;
  if (!racquet) return null;

  let string: StringData | undefined;
  let mains: StringData | undefined;
  let crosses: StringData | undefined;
  if (loadout.isHybrid) {
    mains = STRINGS.find(s => s.id === loadout.mainsId) as StringData | undefined;
    crosses = STRINGS.find(s => s.id === loadout.crossesId) as StringData | undefined;
    if (loadout.mainsGauge && mains) mains = applyGaugeModifier(mains, parseFloat(loadout.mainsGauge));
    if (loadout.crossesGauge && crosses) crosses = applyGaugeModifier(crosses, parseFloat(loadout.crossesGauge));
  } else {
    string = STRINGS.find(s => s.id === loadout.stringId) as StringData | undefined;
    if (loadout.gauge && string) string = applyGaugeModifier(string, parseFloat(loadout.gauge));
  }

  // Non-null assertions safe: verified above
  const stringConfig = loadout.isHybrid
    ? { isHybrid: true as const, mains: mains!, crosses: crosses!, mainsTension: loadout.mainsTension, crossesTension: loadout.crossesTension }
    : { isHybrid: false as const, string: string!, mainsTension: loadout.mainsTension, crossesTension: loadout.crossesTension };

  return { racquet, stringConfig, loadout };
}

/**
 * Sync compendium with active loadout state
 * Returns the racquet ID that should be selected
 */
export function syncCompendiumWithActiveLoadout(): string | null {
  const activeLoadout = getActiveLoadout();
  if (!activeLoadout) return null;
  return activeLoadout.frameId;
}

/**
 * Sync string compendium with active loadout
 * Returns string configuration for injection
 */
export function syncStringCompendiumWithActiveLoadout(): StringCompendiumSync | null {
  const activeLoadout = getActiveLoadout();
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
