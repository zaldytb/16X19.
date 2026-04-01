// Pure setup resolution from a loadout (no store). Used by selectors and setup-sync.

import type { Loadout, Racquet, StringData, StringConfig } from '../engine/types.js';
import { getRacquetById, getStringById } from '../data/loader.js';
import { applyGaugeModifier } from '../engine/index.js';

export interface SetupResult {
  racquet: Racquet;
  stringConfig: StringConfig;
  loadout: Loadout;
}

let _cachedSetupKey: string | null = null;
let _cachedSetupResult: SetupResult | null = null;

function getLoadoutSetupKey(loadout: Loadout): string {
  return [
    loadout.id,
    loadout.frameId,
    loadout.stringId || '',
    loadout.isHybrid ? 'hybrid' : 'full',
    loadout.mainsId || '',
    loadout.crossesId || '',
    loadout.mainsTension,
    loadout.crossesTension,
    loadout.gauge || '',
    loadout.mainsGauge || '',
    loadout.crossesGauge || '',
  ].join('|');
}

/**
 * Get setup from a loadout object (pure function)
 */
export function getSetupFromLoadout(loadout: Loadout | null): SetupResult | null {
  if (!loadout) return null;
  const setupKey = getLoadoutSetupKey(loadout);
  if (_cachedSetupKey === setupKey && _cachedSetupResult) {
    return _cachedSetupResult;
  }

  const racquet = getRacquetById(loadout.frameId) as Racquet | undefined;
  if (!racquet) return null;

  let string: StringData | undefined;
  let mains: StringData | undefined;
  let crosses: StringData | undefined;
  if (loadout.isHybrid) {
    mains = getStringById(loadout.mainsId) as StringData | undefined;
    crosses = getStringById(loadout.crossesId) as StringData | undefined;
    if (loadout.mainsGauge && mains) mains = applyGaugeModifier(mains, parseFloat(loadout.mainsGauge));
    if (loadout.crossesGauge && crosses) crosses = applyGaugeModifier(crosses, parseFloat(loadout.crossesGauge));
  } else {
    string = getStringById(loadout.stringId) as StringData | undefined;
    if (loadout.gauge && string) string = applyGaugeModifier(string, parseFloat(loadout.gauge));
  }

  if (loadout.isHybrid && (!mains || !crosses)) return null;
  if (!loadout.isHybrid && !string) return null;

  const stringConfig = loadout.isHybrid
    ? { isHybrid: true as const, mains: mains!, crosses: crosses!, mainsTension: loadout.mainsTension, crossesTension: loadout.crossesTension }
    : { isHybrid: false as const, string: string!, mainsTension: loadout.mainsTension, crossesTension: loadout.crossesTension };

  const result = { racquet, stringConfig, loadout };
  _cachedSetupKey = setupKey;
  _cachedSetupResult = result;
  return result;
}
