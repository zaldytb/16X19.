import type { Loadout } from '../engine/types.js';

const ACTIVE_LOADOUT_KEY = 'tll-active-loadout';
const ACTIVE_LOADOUT_ID_KEY = 'tll-active-loadout-id';

function getBrowserStorage(): Storage | null {
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

function normalizeStoredLoadout(loadout: Loadout): Loadout {
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

export function persistActiveLoadout(loadout: Loadout | null): void {
  const storage = getBrowserStorage();
  if (!storage) return;

  try {
    if (!loadout) {
      storage.removeItem(ACTIVE_LOADOUT_KEY);
      storage.removeItem(ACTIVE_LOADOUT_ID_KEY);
      return;
    }

    storage.setItem(ACTIVE_LOADOUT_KEY, JSON.stringify(loadout));
    storage.setItem(ACTIVE_LOADOUT_ID_KEY, loadout.id);
  } catch (_error) {
    // Ignore storage failures.
  }
}

export function loadActiveLoadout(): Loadout | null {
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

export function loadActiveLoadoutId(): string | null {
  const storage = getBrowserStorage();
  if (!storage) return null;

  try {
    return storage.getItem(ACTIVE_LOADOUT_ID_KEY);
  } catch (_error) {
    return null;
  }
}
