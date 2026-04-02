import type { Loadout } from '../engine/types.js';

export const ACTIVE_LOADOUT_KEY = 'tll-active-loadout';
export const ACTIVE_LOADOUT_ID_KEY = 'tll-active-loadout-id';
export const SAVED_LOADOUTS_KEY = 'tll-loadouts';

export function getBrowserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch (_error) {
    return null;
  }
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function normalizeStoredLoadout(loadout: Loadout): Loadout {
  return {
    ...loadout,
    mainsTension: toFiniteNumber(loadout.mainsTension, 55),
    crossesTension: toFiniteNumber(loadout.crossesTension, toFiniteNumber(loadout.mainsTension, 53)),
    obs: toFiniteNumber(loadout.obs, 0),
    gauge: loadout.gauge == null ? null : String(loadout.gauge),
    mainsGauge: loadout.mainsGauge == null ? null : String(loadout.mainsGauge),
    crossesGauge: loadout.crossesGauge == null ? null : String(loadout.crossesGauge),
  };
}

export function loadLegacyActiveLoadout(): Loadout | null {
  const storage = getBrowserStorage();
  if (!storage) return null;

  try {
    const stored = storage.getItem(ACTIVE_LOADOUT_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') return null;
    return normalizeStoredLoadout(parsed as Loadout);
  } catch (_error) {
    return null;
  }
}

export function loadLegacyActiveLoadoutId(): string | null {
  const storage = getBrowserStorage();
  if (!storage) return null;

  try {
    return storage.getItem(ACTIVE_LOADOUT_ID_KEY);
  } catch (_error) {
    return null;
  }
}

export function loadLegacySavedLoadouts(): Loadout[] {
  const storage = getBrowserStorage();
  if (!storage) return [];

  try {
    const stored = storage.getItem(SAVED_LOADOUTS_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is Loadout => !!item && typeof item === 'object')
      .map((item) => normalizeStoredLoadout(item));
  } catch (_error) {
    return [];
  }
}
