// src/state/loadout.ts
// Loadout state utilities layered on top of the centralized store.
// Prefer importing from the specific state module you need in new code.

import { RACQUETS, STRINGS } from '../data/loader.js';
import type { Racquet, StringData, Loadout, StringConfig } from '../engine/types.js';
import {
  applyGaugeModifier,
  predictSetup,
  computeCompositeScore,
  generateIdentity,
  buildTensionContext,
} from '../engine/index.js';
import {
  getActiveLoadout as _getActiveLoadout,
  getSavedLoadouts as _getSavedLoadouts,
  addSavedLoadout as _addSavedLoadout,
  removeSavedLoadout as _removeSavedLoadout,
  updateSavedLoadout as _updateSavedLoadout
} from './imperative.js';
import { getSetupFromLoadout } from './setup-sync.js';
import { getBrowserStorage, loadLegacySavedLoadouts } from './legacy-storage.js';

// Re-export the core store accessors from this loadout-focused surface.
export { getActiveLoadout, getSavedLoadouts, setActiveLoadout, setSavedLoadouts } from './imperative.js';

// Persistence helper
const _store = getBrowserStorage();

interface CreateLoadoutOptions {
  id?: string;
  name?: string;
  isHybrid?: boolean;
  mainsId?: string | null;
  crossesId?: string | null;
  crossesTension?: number;
  gauge?: string | null;
  mainsGauge?: string | null;
  crossesGauge?: string | null;
  source?: string;
}

/**
 * Create a new loadout from frame, string, and tension settings
 */
export function createLoadout(
  frameId: string,
  stringId: string | null,
  tension: number,
  opts: CreateLoadoutOptions = {}
): Loadout | null {
  const racquet = RACQUETS.find(r => r.id === frameId) as Racquet | undefined;
  const rawStringData = STRINGS.find(s => s.id === stringId) as StringData | undefined;
  if (!racquet || !rawStringData) return null;

  // Apply gauge modifiers to string data before prediction
  let stringData = rawStringData;
  if (!opts.isHybrid && opts.gauge) {
    stringData = applyGaugeModifier(rawStringData, parseFloat(opts.gauge));
  }

  let mainsData = opts.isHybrid ? STRINGS.find(s => s.id === opts.mainsId) as StringData | undefined : undefined;
  let crossesData = opts.isHybrid ? STRINGS.find(s => s.id === opts.crossesId) as StringData | undefined : undefined;
  if (mainsData && opts.mainsGauge) mainsData = applyGaugeModifier(mainsData, parseFloat(opts.mainsGauge));
  if (crossesData && opts.crossesGauge) crossesData = applyGaugeModifier(crossesData, parseFloat(opts.crossesGauge));

  // Type assertion: mains/crosses are verified to exist when isHybrid=true,
  // stringData always exists when isHybrid=false
  const cfg = opts.isHybrid
    ? { isHybrid: true as const, mains: mainsData!, crosses: crossesData!, mainsTension: tension, crossesTension: opts.crossesTension ?? tension }
    : { isHybrid: false as const, string: stringData, mainsTension: tension, crossesTension: opts.crossesTension ?? tension };

  const stats = predictSetup(racquet, cfg);
  const tCtx = stats ? buildTensionContext(cfg, racquet) : null;
  const obs = stats && tCtx ? computeCompositeScore(stats, tCtx) : 0;
  const identity = stats ? generateIdentity(stats, racquet, cfg) : null;

  // Build name
  let loName = opts.name;
  if (!loName) {
    if (opts.isHybrid && mainsData && crossesData) {
      loName = mainsData.name + ' / ' + crossesData.name + ' on ' + racquet.name;
    } else {
      loName = rawStringData.name + ' on ' + racquet.name;
    }
  }

  return {
    id: opts.id || 'lo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    name: loName || '',
    frameId: frameId,
    stringId: opts.isHybrid ? null : stringId,
    isHybrid: opts.isHybrid || false,
    mainsId: opts.mainsId || null,
    crossesId: opts.crossesId || null,
    mainsTension: tension,
    crossesTension: opts.crossesTension ?? tension,
    gauge: opts.gauge || null,
    mainsGauge: opts.mainsGauge || null,
    crossesGauge: opts.crossesGauge || null,
    stats: stats,
    obs: +obs.toFixed(1),
    identity: identity ? identity.name : '',
    source: opts.source || 'manual',
    _dirty: false
  };
}

/**
 * Persist saved loadouts to localStorage
 */
export function persistSavedLoadouts(): void {
  try {
    if (_store) _store.setItem('tll-loadouts', JSON.stringify(_getSavedLoadouts()));
  } catch(e) {}
}

/**
 * Load saved loadouts from localStorage
 */
export function loadSavedLoadouts(): Loadout[] {
  return loadLegacySavedLoadouts();
}

/**
 * Save a loadout to the saved list
 */
export function saveLoadout(loadout: Loadout): void {
  if (!loadout) return;
  const copy: Loadout = Object.assign({}, loadout);
  delete (copy as Partial<Loadout>)._dirty;
  const sls = _getSavedLoadouts();
  const existing = sls.findIndex(l => l.id === copy.id);
  if (existing >= 0) {
    _updateSavedLoadout(copy.id, copy);
  } else {
    _addSavedLoadout(copy);
  }
}

/**
 * Remove a loadout by ID
 */
export function removeLoadout(loadoutId: string): void {
  _removeSavedLoadout(loadoutId);
}

/**
 * Switch to a saved loadout by ID
 */
export function switchToLoadout(loadoutId: string): Loadout | null {
  const sls = _getSavedLoadouts();
  const lo = sls.find(l => l.id === loadoutId);
  if (lo) {
    const copy: Loadout = Object.assign({}, lo);
    copy._dirty = false;
    return copy;
  }
  return null;
}

/**
 * Export loadouts to JSON string
 */
export function exportLoadouts(): string {
  return JSON.stringify(_getSavedLoadouts(), null, 2);
}

/**
 * Import loadouts from JSON string
 * @returns number of loadouts imported
 */
export function importLoadouts(jsonString: string): number {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) return 0;
    
    let imported = 0;
    const sls = _getSavedLoadouts();
    parsed.forEach((lo: Loadout) => {
      if (lo && lo.id && lo.frameId) {
        const existing = sls.findIndex((l: Loadout) => l.id === lo.id);
        if (existing >= 0) {
          _updateSavedLoadout(lo.id, lo);
        } else {
          _addSavedLoadout(lo);
        }
        imported++;
      }
    });
    
    return imported;
  } catch(e) {
    return 0;
  }
}
